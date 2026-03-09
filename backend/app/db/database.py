import os
import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

# Use Postgres for production if available, else fallback to local sqlite
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cyberguard.db")

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, index=True)
    full_name = Column(String)
    password = Column(String)
    profile_pic = Column(String, nullable=True)
    bio = Column(String, default="CyberGuard Protected Account")
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String)
    caption = Column(String)
    is_reel = Column(Boolean, default=False)
    category = Column(String, default="General") # Comedy, Tech, Music, etc.
    music_id = Column(Integer, ForeignKey("music.id"), nullable=True)
    music_name = Column(String, nullable=True)
    music_url = Column(String, nullable=True)
    music_cover = Column(String, nullable=True)
    likes_count = Column(Integer, default=0) # Total count for easy access
    is_toxic = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

class Story(Base):
    __tablename__ = "stories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    media_url = Column(String)
    mentions = Column(JSON) # List of mentioned usernames
    music_id = Column(Integer, ForeignKey("music.id"), nullable=True)
    music_name = Column(String, nullable=True)
    music_url = Column(String, nullable=True)
    music_cover = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(hours=24))

class Music(Base):
    __tablename__ = "music"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    artist = Column(String)
    cover_url = Column(String)
    audio_url = Column(String)
    spotify_url = Column(String, nullable=True)
    language = Column(String) # Tamil, English

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    is_toxic = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    is_recalled = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String)
    text = Column(String)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    likes_count = Column(Integer, default=0)
    is_toxic = Column(Boolean, default=False)
    toxicity_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class CommentLike(Base):
    __tablename__ = "comment_likes"
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

class Highlight(Base):
    __tablename__ = "highlights"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    cover_url = Column(String)

class HighlightItem(Base):
    __tablename__ = "highlight_items"
    id = Column(Integer, primary_key=True, index=True)
    highlight_id = Column(Integer, ForeignKey("highlights.id"))
    story_id = Column(Integer, ForeignKey("stories.id"))

class TaggedPost(Base):
    __tablename__ = "tagged_posts"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

class FlaggedComment(Base):
    __tablename__ = "flagged_comments"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    is_toxic = Column(Boolean)
    score = Column(Float)
    categories = Column(JSON)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_handle = Column(String)

class Follower(Base):
    __tablename__ = "followers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    follower_id = Column(Integer, ForeignKey("users.id"))

class OTP(Base):
    __tablename__ = "otps"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
