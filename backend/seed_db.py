from sqlalchemy.orm import Session
from app.db.database import SessionLocal, User, Post, Comment, FlaggedComment, Base, engine, Follower, Story, Music, PostLike, CommentLike, Highlight, HighlightItem, TaggedPost
from app.core.classifier import classifier_service
from app.core.security import get_password_hash
import datetime
import random

def seed():
    db = SessionLocal()
    
    # Recreate tables to start fresh
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Seeding high-fidelity database...")

    # 1. Create Users
    main_users = [
        {"username": "tamil", "email": "tamil@example.com", "full_name": "Tamil User", "password": "password123", "bio": "Main Developer of CyberGuard 🛡️ | Coding the Future", "followers_count": 0, "following_count": 0},
        {"username": "alex_dev", "email": "alex@example.com", "full_name": "Alex Rivier", "password": "password123", "bio": "UI/UX Designer | Making the world better", "followers_count": 0, "following_count": 0},
        {"username": "sarah_m", "email": "sarah@example.com", "full_name": "Sarah Miller", "password": "password123", "bio": "Travel Traveler ✈️ | Nature Photography", "followers_count": 0, "following_count": 0},
        {"username": "tech_guru", "email": "guru@example.com", "full_name": "The Tech Guru", "password": "password123", "bio": "AI Ethics & Cyber Security Researcher", "followers_count": 0, "following_count": 0}
    ]

    db_users = []
    for u in main_users:
        u["password"] = get_password_hash(u["password"])
        user = User(**u)
        db.add(user)
        db_users.append(user)
    
    # Generate 40 additional "fan/friend" accounts
    names = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William", "Mia", "Lucas", "Charlotte", "Jack", "Amelia", "Henry", "Harper", "Owen", "Evelyn", "Wyatt", "Abigail", "Leo", "Emily", "Sebastian", "Luna", "Daniel", "Ella", "David", "Chloe"]
    surnames = ["Smith", "Jones", "Brown", "Taylor", "Williams", "Wilson", "Johnson", "Davis", "White", "Clark", "Hall", "Thomas", "Baker", "Hill", "Scott", "Green", "Adams", "King", "Lee", "Allen"]

    for i in range(40):
        name = random.choice(names)
        surname = random.choice(surnames)
        username = f"{name.lower()}_{surname.lower()}_{random.randint(10, 99)}"
        new_u = User(
            username=username,
            email=f"{username}@example.com",
            full_name=f"{name} {surname}",
            password=get_password_hash("password123"),
            bio=f"Tech enthusiast and CyberGuard user | Member #{100+i}",
            followers_count=random.randint(10, 500),
            following_count=random.randint(50, 200)
        )
        db.add(new_u)
        db_users.append(new_u)
    
    db.commit()
    print(f"Created {len(db_users)} user profiles.")

    # 2. Establish Follower relationships
    tamil_id = 1 # The first user created
    for user in db_users:
        if user.id != tamil_id:
            # Everyone follows tamil
            follow = Follower(user_id=tamil_id, follower_id=user.id)
            db.add(follow)
            # Find the tamil db object to increment
            tamil = db.query(User).filter(User.id == tamil_id).first()
            tamil.followers_count += 1
            user.following_count += 1
            
        # Random follows for others
        others = [u for u in db_users if u.id != user.id and u.id != tamil_id]
        random_follows = random.sample(others, k=random.randint(3, 7))
        for target in random_follows:
            f = Follower(user_id=target.id, follower_id=user.id)
            db.add(f)
            target.followers_count += 1
            user.following_count += 1
    
    db.commit()
    print("Established massive social network graph.")

    # 3. Create actual Posts & Reels
    posts_data = [
        {
            "user_id": 1, 
            "image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&fit=crop",
            "caption": "CyberGuard AI is now officially monitoring the network. Safety first! 🛡️💻",
            "likes_count": 4200,
            "is_reel": False
        },
        {
            "user_id": 2, 
            "image_url": "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&fit=crop",
            "caption": "New UI layout for the analytics page. Clean, dark, and fast. #Design",
            "likes_count": 1200,
            "is_reel": False
        },
        {
            "user_id": 15, 
            "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&fit=crop",
            "caption": "Coding session with the squad. Stay safe out there! 💻🛡️",
            "likes_count": 850,
            "is_reel": False
        },
        # REELS
        {
            "user_id": 6, 
            "image_url": "https://player.vimeo.com/external/370331493.sd.mp4?s=33d548697558f692291b9204060591295988d5e0&profile_id=139&oauth2_token_id=57447761",
            "caption": "Exploring the digital frontier with AI protection 🛡️ #Future #Tech",
            "likes_count": 15400,
            "is_reel": True
        }
    ]

    for p in posts_data:
        analysis = classifier_service.predict(p["caption"])
        post = Post(**p, is_toxic=analysis["is_toxic"])
        db.add(post)
    
    db.commit()

    # 4. Add Stories & Highlights
    story_media = [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&fit=crop",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&fit=crop"
    ]
    for i, user in enumerate(db_users[:5]):
        story = Story(user_id=user.id, media_url=random.choice(story_media), mentions=[])
        db.add(story)
    
    db.commit()

    # 5. Add Music
    songs = [
        {"title": "Arabic Kuthu", "artist": "Anirudh", "language": "Tamil", "cover_url": "https://c.saavncdn.com/264/Arabic-Kuthu-From-Beast-Tamil-2022-20220213191500-500x500.jpg"},
        {"title": "Blinding Lights", "artist": "The Weeknd", "language": "English", "cover_url": "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png"}
    ]
    for s in songs:
        m = Music(**s)
        db.add(m)
    
    db.commit()

    # 6. Add heavy interactions (Comments)
    tamil_post_id = 1
    comments = [
        {"post_id": 1, "user_id": 2, "username": "alex_dev", "text": "This is a massive milestone! 🚀", "likes_count": 10},
        {"post_id": 1, "user_id": 12, "username": "toxic_bot_99", "text": "Useless project lol.", "likes_count": 0},
    ]

    for c in comments:
        analysis = classifier_service.predict(c["text"])
        new_comment = Comment(**c, is_toxic=analysis["is_toxic"], toxicity_score=analysis["score"])
        db.add(new_comment)
        
        flagged = FlaggedComment(
            text=c["text"],
            is_toxic=analysis["is_toxic"],
            score=analysis["score"],
            categories=analysis["categories"],
            user_handle=c["username"]
        )
        db.add(flagged)

    db.commit()
    print("Database successfully seeded with full social activity!")

if __name__ == "__main__":
    seed()
