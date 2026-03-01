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
from app.db.database import get_db, User, Post, Message, FlaggedComment, Comment, Follower, Story, Music
from app.core.security import verify_password, get_password_hash, create_access_token


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


class PostCreate(BaseModel):
    user_id: int
    image_url: str
    caption: str
    is_reel: bool = False
    category: str = "General"
    music_name: Optional[str] = None


class StoryCreate(BaseModel):
    user_id: int
    media_url: str
    mentions: List[str] = []


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


# ---------- IMAGE UPLOAD FIX ----------

@router.post("/posts/upload")
async def upload_media(file: UploadFile = File(...)):

    try:

        print("Uploading File...")
        
        # Pass the spooled file object directly, rather than reading it into a string
        # This will prevent utf-8 decoding errors for raw bytes (like videos)
        is_video = file.content_type and file.content_type.startswith("video/")

        if is_video:
            result = cloudinary.uploader.upload_large(
                file.file,
                resource_type="video",
                chunk_size=10000000 # 10MB chunks
            )
        else:
            result = cloudinary.uploader.upload(
                file.file,
                resource_type="image"
            )

        print("SUCCESS:", result["secure_url"])

        return {
            "url": result["secure_url"]
        }

    except Exception as e:

        print("UPLOAD ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ---------- AUTH ----------

@router.post("/auth/signup")
async def signup(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        username=user.username,
        email=user.email,
        password=get_password_hash(user.password),
        full_name=user.full_name
    )

    db.add(new_user)
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

    analysis = classifier_service.predict(post.caption)

    new_post = Post(
        user_id=post.user_id,
        image_url=post.image_url,
        caption=post.caption,
        is_reel=post.is_reel,
        category=post.category,
        music_name=post.music_name,
        is_toxic=analysis["is_toxic"]
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post


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
            "music_name": p.music_name,
            "is_toxic": p.is_toxic,
            "likes": p.likes,
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

@router.post("/posts/like/{post_id}")
async def like_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post: raise HTTPException(404)
    post.likes += 1
    db.commit()
    db.refresh(post)
    return {"likes": post.likes}

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
async def get_profile(username: str, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.username == username
    ).first()

    if not user:
        raise HTTPException(404)

    posts = db.query(Post).filter(
        Post.user_id == user.id
    ).order_by(Post.timestamp.desc()).all()
    
    post_data = []
    for p in posts:
        comments_count = db.query(Comment).filter(Comment.post_id == p.id).count()
        post_data.append({
            "id": p.id,
            "user_id": p.user_id,
            "image_url": p.image_url,
            "caption": p.caption,
            "is_reel": p.is_reel,
            "likes": p.likes,
            "comments_count": comments_count,
            "timestamp": p.timestamp
        })

    # Count followers & following
    followers_count = db.query(Follower).filter(Follower.user_id == user.id).count()
    following_count = db.query(Follower).filter(Follower.follower_id == user.id).count()

    user_dict = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "bio": user.bio,
        "profile_pic": user.profile_pic,
        "followers_count": followers_count,
        "following_count": following_count
    }

    return {
        "user": user_dict,
        "posts": post_data
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
async def create_comment(
        comment: CommentCreate,
        db: Session = Depends(get_db)):

    analysis = classifier_service.predict(comment.text)

    new_comment = Comment(
        post_id=comment.post_id,
        user_id=comment.user_id,
        username=comment.username,
        text=comment.text,
        is_toxic=analysis["is_toxic"]
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment


@router.get("/comments/{post_id}")
async def get_comments(
        post_id: int,
        db: Session = Depends(get_db)):

    return db.query(Comment).filter(
        Comment.post_id == post_id
    ).all()

# ---------- STORIES ----------

@router.get("/stories/all")
async def get_stories(db: Session = Depends(get_db)):
    # Fake stories for demo purposes (Tamil actors/actresses and AI)
    fake_stories = [
        {
            "id": 101,
            "user": "actor_vijay",
            "img": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&fit=crop",
            "profile_pic": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&fit=crop",
            "mentions": ["leo", "thalapathy"]
        },
        {
            "id": 102,
            "user": "samantha",
            "img": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&fit=crop",
            "profile_pic": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop",
            "mentions": ["chennai", "vibes"]
        },
        {
            "id": 103,
            "user": "cyber_ai",
            "img": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&fit=crop",
            "profile_pic": "https://images.unsplash.com/photo-1531297122539-d31da0ceae6e?w=150&fit=crop",
            "mentions": ["future", "tech"]
        },
        {
            "id": 104,
            "user": "anirudh",
            "img": "https://images.unsplash.com/photo-1493225457124-a1a2a5956093?w=800&fit=crop",
            "profile_pic": "https://images.unsplash.com/photo-1516280440502-c62548483a3f?w=150&fit=crop",
            "mentions": ["music", "concert"]
        },
        {
            "id": 105,
            "user": "ai_guard",
            "img": "https://images.unsplash.com/photo-1633398814361-b8f2c3eb1f87?w=800&fit=crop",
            "profile_pic": "https://images.unsplash.com/photo-1614064641913-6b7140414df8?w=150&fit=crop",
            "mentions": ["safe", "shield"]
        }
    ]
    return fake_stories

# ---------- ANALYTICS ----------

@router.get("/analytics")
async def get_analytics(db: Session = Depends(get_db)):
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
        "total_checks": total_checks + 2500, # Pad with some fake high numbers for effect as requested by UI
        "toxic_count": toxic_count + 124,
        "safety_rate": safety_rate,
        "recent_activity": recent_activity[:5]
    }

# ---------- MUSIC ----------

@router.get("/music/library")
async def get_music_library(db: Session = Depends(get_db)):
    # Fake music library
    return [
        {"id": 1, "title": "Naa Ready", "artist": "Thalapathy Vijay, Anirudh", "cover_url": "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=150&fit=crop", "language": "Tamil"},
        {"id": 2, "title": "Hukum", "artist": "Anirudh Ravichander", "cover_url": "https://images.unsplash.com/photo-1614680376593-902f74a5cecb?w=150&fit=crop", "language": "Tamil"},
        {"id": 3, "title": "Blinding Lights", "artist": "The Weeknd", "cover_url": "https://images.unsplash.com/photo-1493225457124-a1a2a5956093?w=150&fit=crop", "language": "English"},
        {"id": 4, "title": "Levitating", "artist": "Dua Lipa", "cover_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&fit=crop", "language": "English"},
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
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
            and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
        )
    ).order_by(Message.timestamp.asc()).all()
    return messages

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