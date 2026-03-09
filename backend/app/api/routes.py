import os
import datetime
import cloudinary
import cloudinary.uploader

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

from app.core.classifier import classifier_service
import secrets
import smtplib
from email.mime.text import MIMEText
from app.db.database import get_db, User, Post, Message, FlaggedComment, Comment, Follower, Story, Music, OTP
from app.core.security import verify_password, get_password_hash, create_access_token
import requests


# ✅ LOAD ENV (VERY IMPORTANT)
load_dotenv(dotenv_path=".env")

print("CLOUD:", os.getenv("CLOUDINARY_CLOUD_NAME"))
print("KEY:", os.getenv("CLOUDINARY_API_KEY"))

# ✅ CLOUDINARY CONFIG
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ---------- SCHEMAS ----------

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    otp_code: str # Require OTP code for signup

class OTPSend(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    code: str


class PostCreate(BaseModel):
    user_id: int
    image_url: str
    caption: str
    is_reel: bool = False
    category: str = "General"
    music_id: Optional[int] = None
    music_name: Optional[str] = None
    music_url: Optional[str] = None
    music_cover: Optional[str] = None


class StoryCreate(BaseModel):
    user_id: int
    media_url: str
    mentions: List[str] = []
    music_id: Optional[int] = None
    music_name: Optional[str] = None
    music_url: Optional[str] = None
    music_cover: Optional[str] = None


class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    content: str


class ProfileUpdate(BaseModel):
    user_id: int
    full_name: str
    bio: str
    profile_pic: Optional[str] = None


class CommentCreate(BaseModel):
    post_id: int
    user_id: int
    username: str
    text: str
    parent_id: Optional[int] = None

class LikeRequest(BaseModel):
    user_id: int


import tempfile
import shutil

# ---------- MEDIA UPLOAD ----------

@router.post("/posts/upload")
async def upload_media(file: UploadFile = File(...)):
    temp_path = None
    try:
        # Check Cloudinary Keys explicitly
        if not os.getenv("CLOUDINARY_API_KEY"):
            raise Exception("Cloudinary API Keys not found in .env")

        print(f"📡 [FILESYSTEM] Buffering {file.filename}...")
        
        # Save to temp file
        suffix = f".{file.filename.split('.')[-1]}" if "." in file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name

        print(f"🎬 [CLOUDINARY] Uploading {file.content_type} with Multi-part Sync...")
        
        # Using upload_large is better for videos and works with auto resource type.
        result = cloudinary.uploader.upload_large(
            temp_path,
            resource_type="auto",
            chunk_size=10000000 # 10MB chunks (ideal for Reels)
        )

        print(f"✅ [SUCCESS] Cloudinary URL: {result['secure_url']}")

        if os.path.exists(temp_path):
            os.remove(temp_path)

        return {"url": result["secure_url"]}

    except Exception as e:
        print(f"❌ [CRITICAL] Upload Error: {str(e)}")
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Cloudinary Error: {str(e)}")


# ---------- AUTH ----------

# Helper for sending email
def send_email(subject: str, recipient: str, body: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not smtp_user or not smtp_password or "your-email" in smtp_user:
        print("⚠️ [MAIL] Missing or Placeholder SMTP Credentials. Using Demo Mode.")
        return False

    msg = MIMEText(body)
    # Cast to str for linter/runtime safety
    msg["Subject"] = str(subject)
    msg["From"] = str(smtp_user)
    msg["To"] = str(recipient)

    try:
        print(f"📡 [MAIL] Attempting to send OTP to {recipient}...")
        with smtplib.SMTP(str(smtp_server), smtp_port) as server:
            server.starttls()
            server.login(str(smtp_user), str(smtp_password))
            server.send_message(msg)
        print("✅ [MAIL] Email sent successfully!")
        return True
    except Exception as e:
        print(f"❌ [MAIL] Error: {str(e)}")
        # If it's a login error, remind about App Password
        if "Authentication failed" in str(e):
            print("💡 TIP: Use a Google 'App Password', not your regular login password.")
        return False

@router.post("/auth/send-otp")
async def send_otp(data: OTPSend, db: Session = Depends(get_db)):
    # Check if email already has 5 accounts
    account_count = db.query(User).filter(User.email == data.email).count()
    if account_count >= 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 accounts per email allowed."
        )

    # Generate 6 digit code
    code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    
    # Save to DB (overwrite existing for this email)
    db.query(OTP).filter(OTP.email == data.email).delete()
    
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    new_otp = OTP(email=data.email, code=code, expires_at=expires)
    db.add(new_otp)
    db.commit()

    # Send email
    subject = "Your CyberGuard Verification Code"
    body = f"Hello,\n\nYour OTP for registration is: {code}\n\nThis code expires in 10 minutes.\n\nStay Safe!"
    
    sent = send_email(subject, data.email, body)
    
    if not sent:
        # For local demo purposes, if email fails, return code in response so user can test
        return {"message": "OTP Generated (Mail Fail)", "code": code}

    return {"message": "OTP sent to email"}

@router.post("/auth/verify-otp")
async def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):
    otp_record = db.query(OTP).filter(
        OTP.email == data.email,
        OTP.code == data.code
    ).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if otp_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    return {"message": "OTP verified successfully"}

@router.post("/auth/signup")
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Verify OTP again during final signup step
    otp_record = db.query(OTP).filter(
        OTP.email == user.email,
        OTP.code == user.otp_code
    ).first()

    if not otp_record or otp_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP verification failed")

    # Double check account limit
    account_count = db.query(User).filter(User.email == user.email).count()
    if account_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 accounts limit reached")

    # Check if username is taken
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=user.username,
        email=user.email,
        password=get_password_hash(user.password),
        full_name=user.full_name
    )

    db.add(new_user)
    # Clean up OTP after success
    db.delete(otp_record)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(
        data={"sub": new_user.username}
    )

    return {
        "access_token": token,
        "user": new_user
    }


@router.post("/auth/login")
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.username == form_data.username
    ).first()

    if not user or not verify_password(
            form_data.password,
            user.password):

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        data={"sub": user.username}
    )

    return {
        "access_token": token,
        "user": user
    }


# ---------- POSTS ----------

@router.post("/posts/create")
async def create_post(post: PostCreate, db: Session = Depends(get_db)):
    try:
        print(f"📡 [DB-SYNC] Payload Received for user {post.user_id}")
        
        # Ensure is_reel is truly a boolean
        # Also check file extension for extra safety
        is_reel_video = str(post.image_url).lower().endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm'))
        final_is_reel = bool(post.is_reel) if post.is_reel is not None else is_reel_video

        analysis = classifier_service.predict(post.caption)
        
        new_post = Post(
            user_id=post.user_id,
            image_url=post.image_url,
            caption=post.caption,
            is_reel=final_is_reel,
            category=post.category,
            music_id=post.music_id,
            music_name=post.music_name,
            music_url=post.music_url,
            music_cover=post.music_cover,
            is_toxic=analysis["is_toxic"]
        )

        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        print(f"✅ [DB-SYNC] Post shared successfully! ID: {new_post.id}")
        return new_post
    except Exception as e:
        print(f"❌ [DB-SYNC] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database Issue: {str(e)}")


@router.get("/posts/all")
async def get_posts(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):

    posts = db.query(Post).order_by(Post.timestamp.desc()).offset(skip).limit(limit).all()
    
    result = []
    for p in posts:
        user = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "image_url": p.image_url,
            "caption": p.caption,
            "is_reel": p.is_reel,
            "category": p.category,
            "music_id": p.music_id,
            "music_name": p.music_name,
            "music_url": p.music_url,
            "music_cover": p.music_cover,
            "is_toxic": p.is_toxic,
            "likes": p.likes_count,
            "timestamp": p.timestamp,
            "user_handle": user.username if user else "Unknown",
            "user_pic": user.profile_pic if user else None
        })

    return result

class PostUpdate(BaseModel):
    caption: str

@router.put("/posts/{post_id}")
async def update_post(post_id: int, data: PostUpdate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post: raise HTTPException(404)
    post.caption = data.caption
    db.commit()
    db.refresh(post)
    return post

@router.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post: raise HTTPException(404)
    db.delete(post)
    db.commit()
    return {"message": "Deleted"}

from app.db.database import PostLike, CommentLike, Highlight, HighlightItem, TaggedPost

@router.post("/posts/like/{post_id}")
async def like_post(post_id: int, data: LikeRequest, db: Session = Depends(get_db)):
    # Check if already liked
    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == data.user_id
    ).first()
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post: raise HTTPException(404)
    
    if existing:
        db.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        db.commit()
        return {"likes": post.likes_count, "status": "unliked"}
    
    new_like = PostLike(post_id=post_id, user_id=data.user_id)
    db.add(new_like)
    post.likes_count += 1
    db.commit()
    return {"likes": post.likes_count, "status": "liked"}

@router.get("/users/all")
async def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "full_name": u.full_name, "profile_pic": u.profile_pic} for u in users]


# ---------- SEARCH ----------

@router.get("/search")
async def search_network(q: str, db: Session = Depends(get_db)):
    users = db.query(User).filter(User.username.ilike(f"%{q}%")).all()
    posts = db.query(Post).filter(Post.caption.ilike(f"%{q}%")).all()
    
    return {
        "users": [{"id": u.id, "username": u.username, "full_name": u.full_name, "profile_pic": u.profile_pic} for u in users],
        "posts": [{"id": p.id, "image_url": p.image_url, "caption": p.caption, "is_toxic": p.is_toxic} for p in posts]
    }

# ---------- PROFILE ----------

@router.get("/profile/{username}")
async def get_profile(username: str, current_user_id: Optional[int] = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user: raise HTTPException(404)

    posts = db.query(Post).filter(Post.user_id == user.id).order_by(Post.timestamp.desc()).all()
    
    post_data = []
    reel_data = []
    for p in posts:
        comments_count = db.query(Comment).filter(Comment.post_id == p.id).count()
        item = {
            "id": p.id,
            "user_id": p.user_id,
            "image_url": p.image_url,
            "caption": p.caption,
            "is_reel": p.is_reel,
            "likes": p.likes_count,
            "comments_count": comments_count,
            "timestamp": p.timestamp
        }
        if p.is_reel:
            reel_data.append(item)
        else:
            post_data.append(item)

    # Tagged posts
    tagged_recs = db.query(TaggedPost).filter(TaggedPost.user_id == user.id).all()
    tagged_post_ids = [t.post_id for t in tagged_recs]
    tagged_posts = db.query(Post).filter(Post.id.in_(tagged_post_ids)).all() if tagged_post_ids else []
    
    # Highlights
    highlights = db.query(Highlight).filter(Highlight.user_id == user.id).all()
    highlight_data = []
    for h in highlights:
        items = db.query(HighlightItem).filter(HighlightItem.highlight_id == h.id).all()
        highlight_data.append({
            "id": h.id,
            "name": h.name,
            "cover_url": h.cover_url,
            "count": len(items)
        })

    # Mutual Followers
    mutual_followers = []
    if current_user_id and current_user_id != user.id:
        # People current_user follows who ALSO follow target user
        following_ids = [f.user_id for f in db.query(Follower).filter(Follower.follower_id == current_user_id).all()]
        followers_of_target = [f.follower_id for f in db.query(Follower).filter(Follower.user_id == user.id).all()]
        mutual_ids = set(following_ids).intersection(set(followers_of_target))
        if mutual_ids:
            mutual_users = db.query(User).filter(User.id.in_(list(mutual_ids))).limit(3).all()
            mutual_followers = [{"id": u.id, "username": u.username, "profile_pic": u.profile_pic} for u in mutual_users]

    followers_count = db.query(Follower).filter(Follower.user_id == user.id).count()
    following_count = db.query(Follower).filter(Follower.follower_id == user.id).count()

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "bio": user.bio,
            "profile_pic": user.profile_pic,
            "followers_count": followers_count,
            "following_count": following_count,
            "total_posts": len(post_data) + len(reel_data)
        },
        "posts": post_data,
        "reels": reel_data,
        "tagged": [{"id": p.id, "image_url": p.image_url} for p in tagged_posts],
        "highlights": highlight_data,
        "mutual_followers": mutual_followers
    }

class FollowData(BaseModel):
    follower_id: int

@router.post("/profile/{username}/follow")
async def follow_user(username: str, data: FollowData, db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user: raise HTTPException(404)
    
    existing = db.query(Follower).filter(
        Follower.user_id == target_user.id,
        Follower.follower_id == data.follower_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unfollowed"}
        
    new_follower = Follower(user_id=target_user.id, follower_id=data.follower_id)
    db.add(new_follower)
    db.commit()
    return {"status": "followed"}

@router.get("/profile/{username}/followers")
async def get_followers(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(404)
    followers = db.query(Follower).filter(Follower.user_id == user.id).all()
    follower_ids = [f.follower_id for f in followers]
    follower_users = db.query(User).filter(User.id.in_(follower_ids)).all()
    return follower_users

@router.get("/profile/{username}/following")
async def get_following(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(404)
    following = db.query(Follower).filter(Follower.follower_id == user.id).all()
    following_ids = [f.user_id for f in following]
    following_users = db.query(User).filter(User.id.in_(following_ids)).all()
    return following_users



@router.post("/profile/update")
async def update_profile(
        data: ProfileUpdate,
        db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.id == data.user_id
    ).first()

    user.full_name = data.full_name
    user.bio = data.bio

    if data.profile_pic:
        user.profile_pic = data.profile_pic

    db.commit()
    db.refresh(user)

    return user


# ---------- COMMENTS ----------

@router.post("/comments/create")
async def create_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    analysis = classifier_service.predict(comment.text)
    new_comment = Comment(
        post_id=comment.post_id,
        user_id=comment.user_id,
        username=comment.username,
        text=comment.text,
        parent_id=comment.parent_id,
        is_toxic=analysis["is_toxic"]
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.post("/comments/like/{comment_id}")
async def like_comment(comment_id: int, data: LikeRequest, db: Session = Depends(get_db)):
    existing = db.query(CommentLike).filter(
        CommentLike.comment_id == comment_id,
        CommentLike.user_id == data.user_id
    ).first()
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment: raise HTTPException(404)
    if existing:
        db.delete(existing)
        comment.likes_count = max(0, comment.likes_count - 1)
        db.commit()
        return {"likes": comment.likes_count, "status": "unliked"}
    new_like = CommentLike(comment_id=comment_id, user_id=data.user_id)
    db.add(new_like)
    comment.likes_count += 1
    db.commit()
    return {"likes": comment.likes_count, "status": "liked"}

@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int, user_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment: raise HTTPException(404)
    post = db.query(Post).filter(Post.id == comment.post_id).first()
    # Only post owner or comment owner can delete
    if post.user_id != user_id and comment.user_id != user_id:
        raise HTTPException(403, detail="Not authorized")
    db.delete(comment)
    db.commit()
    return {"status": "deleted"}


@router.get("/comments/{post_id}")
async def get_comments(
        post_id: int,
        db: Session = Depends(get_db)):

    return db.query(Comment).filter(
        Comment.post_id == post_id
    ).all()

# ---------- STORIES ----------

@router.post("/stories/create")
async def create_story(story: StoryCreate, db: Session = Depends(get_db)):
    new_story = Story(
        user_id=story.user_id,
        media_url=story.media_url,
        mentions=story.mentions,
        music_id=story.music_id,
        music_name=story.music_name,
        music_url=story.music_url,
        music_cover=story.music_cover
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    return new_story

@router.get("/stories/all")
async def get_stories(db: Session = Depends(get_db)):
    # Fetch real stories from DB that haven't expired
    now = datetime.datetime.utcnow()
    real_stories = db.query(Story).filter(Story.expires_at > now).all()
    
    result = []
    for s in real_stories:
        user = db.query(User).filter(User.id == s.user_id).first()
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "user": user.username if user else "Unknown",
            "img": s.media_url,
            "profile_pic": user.profile_pic if user else None,
            "mentions": s.mentions,
            "music_name": s.music_name,
            "music_url": s.music_url,
            "music_cover": s.music_cover,
            "timestamp": s.timestamp
        })
    
    # Append fake stories if list is small
    if len(result) < 3:
        fake_stories = [
            {"id": 101, "user": "actor_vijay", "img": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&fit=crop", "profile_pic": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&fit=crop", "mentions": ["leo", "thalapathy"]},
            {"id": 102, "user": "samantha", "img": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&fit=crop", "profile_pic": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop", "mentions": ["chennai", "vibes"]},
        ]
        result.extend(fake_stories)
    return result

class HighlightCreate(BaseModel):
    user_id: int
    name: str
    cover_url: str
    story_ids: List[int]

@router.post("/highlights/create")
async def create_highlight(data: HighlightCreate, db: Session = Depends(get_db)):
    new_h = Highlight(user_id=data.user_id, name=data.name, cover_url=data.cover_url)
    db.add(new_h)
    db.commit()
    db.refresh(new_h)
    for sid in data.story_ids:
        item = HighlightItem(highlight_id=new_h.id, story_id=sid)
        db.add(item)
    db.commit()
    return new_h

# ---------- ANALYTICS ----------

@router.get("/analytics")
async def get_analytics(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if user_id:
        # Get user's own posts
        user_posts = db.query(Post).filter(Post.user_id == user_id).all()
        post_ids = [p.id for p in user_posts]
        
        # Count toxic comments for these specific posts
        toxic_comments_count = db.query(Comment).filter(
            Comment.post_id.in_(post_ids),
            Comment.is_toxic == True
        ).count()
        
        # Detailed breakdown per post
        post_stats = []
        for p in user_posts:
            toxic_comments = db.query(Comment).filter(
                Comment.post_id == p.id,
                Comment.is_toxic == True
            ).all()
            
            if toxic_comments:
                post_stats.append({
                    "id": p.id,
                    "caption": p.caption,
                    "image_url": p.image_url,
                    "bad_comments_count": len(toxic_comments),
                    "toxic_details": [
                        {"username": c.username, "text": c.text, "timestamp": c.timestamp}
                        for c in toxic_comments
                    ]
                })
        
        return {
            "total_checks": len(user_posts) + db.query(Comment).filter(Comment.post_id.in_(post_ids)).count(),
            "toxic_count": toxic_comments_count,
            "safety_rate": 100.0,
            "post_stats": post_stats,
            "is_user_specific": True
        }

    total_posts = db.query(Post).count()
    total_comments = db.query(Comment).count()
    toxic_posts = db.query(Post).filter(Post.is_toxic == True).count()
    toxic_comments = db.query(Comment).filter(Comment.is_toxic == True).count()
    
    total_checks = total_posts + total_comments
    toxic_count = toxic_posts + toxic_comments
    
    safety_rate = 100.0
    if total_checks > 0:
        safety_rate = ((total_checks - toxic_count) / total_checks) * 100
        
    recent_activity = []
    
    recent_comments = db.query(Comment).order_by(Comment.timestamp.desc()).limit(5).all()
    for c in recent_comments:
        recent_activity.append({
            "text": c.text,
            "is_toxic": c.is_toxic,
            "score": c.toxicity_score if hasattr(c, 'toxicity_score') else 1.0,
            "user_handle": c.username,
            "timestamp": c.timestamp
        })
        
    recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "total_checks": total_checks + 2500,
        "toxic_count": toxic_count + 124,
        "safety_rate": safety_rate,
        "recent_activity": recent_activity[:5],
        "is_user_specific": False
    }

# ---------- MUSIC ----------

@router.get("/music/library")
async def get_music_library(q: Optional[str] = None, db: Session = Depends(get_db)):
    # If a search query is provided, fetch from iTunes API
    if q:
        try:
            # Search for Tamil music specifically if the user is looking for it
            search_query = q if "tamil" in q.lower() else f"{q} Tamil"
            response = requests.get(
                f"https://itunes.apple.com/search?term={search_query}&entity=song&limit=10",
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                results = []
                for idx, song in enumerate(data.get("results", [])):
                    results.append({
                        "id": 1000 + idx, # Temporary ID
                        "title": song.get("trackName"),
                        "artist": song.get("artistName"),
                        "cover_url": song.get("artworkUrl100"),
                        "audio_url": song.get("previewUrl"),
                        "language": "Tamil",
                        "spotify_url": song.get("trackViewUrl")
                    })
                return results
        except Exception as e:
            print(f"⚠️ Music search error: {e}")
            pass # Fallback to default list

    # Default trending Tamil music list
    return [
        {"id": 1, "title": "Arabic Kuthu", "artist": "Anirudh", "cover_url": "https://c.saavncdn.com/264/Arabic-Kuthu-From-Beast-Tamil-2022-20220213191500-500x500.jpg", "language": "Tamil", "spotify_url": "https://open.spotify.com/track/0Y7Y4Y1vU68O2vV5YnxXJ1", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
        {"id": 2, "title": "Naa Ready", "artist": "Thalapathy Vijay, Anirudh", "cover_url": "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=150&fit=crop", "language": "Tamil", "spotify_url": "https://open.spotify.com/track/1R0Z5hR10XW0qBiv2t6R0t", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
        {"id": 3, "title": "Hukum", "artist": "Anirudh Ravichander", "cover_url": "https://images.unsplash.com/photo-1614680376593-902f74a5cecb?w=150&fit=crop", "language": "Tamil", "spotify_url": "https://open.spotify.com/track/6UeSveYkLreQ0o6o5xW6Yt", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"},
        {"id": 4, "title": "Blinding Lights", "artist": "The Weeknd", "cover_url": "https://images.unsplash.com/photo-1493225457124-a1a2a5956093?w=150&fit=crop", "language": "English", "spotify_url": "https://open.spotify.com/track/0VjIj9STn2LhZ9Yp76YpS5", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"},
        {"id": 5, "title": "Levitating", "artist": "Dua Lipa", "cover_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&fit=crop", "language": "English", "spotify_url": "https://open.spotify.com/track/39Yp9IuYvYm9Ynz6XqS9Yp", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"},
    ]

# ---------- REELS ----------

@router.get("/reels/all")
async def get_reels(category: str = "All", db: Session = Depends(get_db)):
    # Fake reels showing high quality video, labelled as Tamil scenes 
    fake_reels = [
        {
            "id": 201,
            "user_id": 1,
            "user_handle": "vijay_fan_page",
            "user_pic": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=150&fit=crop",
            "image_url": "https://videos.pexels.com/video-files/3863008/3863008-uhd_2160_4096_30fps.mp4",
            "caption": "Thalapathy Mass Comedy Scene! 😂🔥 #thalapathy #comedy #tamil",
            "is_reel": True,
            "category": "Comedy",
            "music_name": "Naa Ready - Leo",
            "likes": 45120
        },
        {
            "id": 202,
            "user_id": 2,
            "user_handle": "samantha_fc",
            "user_pic": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&fit=crop",
            "image_url": "https://videos.pexels.com/video-files/4006199/4006199-uhd_2160_4096_25fps.mp4",
            "caption": "Beautiful Love Scene 🥺❤️ #love #romantic #samantha",
            "is_reel": True,
            "category": "Vlog",
            "music_name": "Kanmani Anbodu - Guna",
            "likes": 89201
        },
        {
            "id": 203,
            "user_id": 3,
            "user_handle": "action_tamil",
            "user_pic": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&fit=crop",
            "image_url": "https://videos.pexels.com/video-files/5826925/5826925-uhd_2160_4096_24fps.mp4",
            "caption": "Vikram Interval Block High Quality 🥵🔥 #action #vikram #kamalhaasan",
            "is_reel": True,
            "category": "Tech",
            "music_name": "Vikram Title Track",
            "likes": 125000
        },
        {
            "id": 204,
            "user_id": 4,
            "user_handle": "anirudh_vibes",
            "user_pic": "https://images.unsplash.com/photo-1493225457124-a1a2a5956093?w=150&fit=crop",
            "image_url": "https://videos.pexels.com/video-files/2792370/2792370-uhd_2160_4096_24fps.mp4",
            "caption": "Anirudh Live Concert Entry! 🎸😎 #music #anirudh #live",
            "is_reel": True,
            "category": "Music",
            "music_name": "Hukum - Jailer",
            "likes": 200500
        }
    ]
    
    if category != "All":
        fake_reels = [r for r in fake_reels if r["category"] == category]
        
    return fake_reels

# ---------- MESSAGES ----------

@router.get("/messages/{user1_id}/{user2_id}")
async def get_messages(user1_id: int, user2_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import or_, and_
    msgs = db.query(Message).filter(
        or_(
            and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
            and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    return [{
        "id": m.id,
        "sender_id": m.sender_id,
        "content": "🛡️ Content Restrained" if m.is_recalled else m.content,
        "is_toxic": m.is_toxic,
        "is_recalled": m.is_recalled,
        "likes": m.likes_count,
        "timestamp": m.timestamp
    } for m in msgs]

@router.delete("/messages/{message_id}")
async def unsend_message(message_id: int, user_id: int, db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg: raise HTTPException(404)
    if msg.sender_id != user_id: raise HTTPException(403)
    msg.is_recalled = True
    db.commit()
    return {"status": "recalled"}

@router.post("/messages/like/{message_id}")
async def like_message(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg: raise HTTPException(404)
    msg.likes_count += 1
    db.commit()
    return {"likes": msg.likes_count}

@router.post("/messages/send")
async def send_message(msg: MessageCreate, db: Session = Depends(get_db)):
    analysis = classifier_service.predict(msg.content)
    
    new_message = Message(
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        is_toxic=analysis["is_toxic"]
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message