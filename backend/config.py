"""
API service configuration
"""
import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
from dotenv import load_dotenv

load_dotenv()

# Firebase Admin SDK initialization
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
    except ValueError:
        # Initialize with environment variables or service account
        if os.getenv("FIREBASE_PRIVATE_KEY"):
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            })
            firebase_admin.initialize_app(cred, {
                'storageBucket': os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET")
            })
        else:
            # Use default credentials (for Cloud Run)
            firebase_admin.initialize_app()
    
    return firestore.client(), storage.bucket()

# Global instances
db = None
bucket = None

def get_firestore_client():
    """Get Firestore client instance"""
    global db
    if db is None:
        db, _ = initialize_firebase()
    return db

def get_storage_bucket():
    """Get Cloud Storage bucket instance"""
    global bucket
    if bucket is None:
        _, bucket = initialize_firebase()
    return bucket
