import argparse
import sys
from getpass import getpass
from sqlalchemy.orm import Session
import database, models, security

def create_admin(full_name: str, email: str, password: str):
    db: Session = database.SessionLocal()
    try:
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"Error: User with email '{email}' already exists.")
            sys.exit(1)

        hashed_password = security.get_password_hash(password)
        admin_user = models.User(
            full_name=full_name,
            email=email,
            hashed_password=hashed_password,
            role=models.UserRole.admin
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Success: Admin account '{email}' created successfully with ID {admin_user.id}.")
    except Exception as e:
        db.rollback()
        print(f"Failed to create admin user: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create an administrator account securely.")
    parser.add_argument("--name", help="Full name of administrator")
    parser.add_argument("--email", help="Email of administrator")

    args = parser.parse_args()

    name = args.name or input("Enter administrator full name: ").strip()
    email = args.email or input("Enter administrator email: ").strip()
    password = getpass("Enter administrator password (min 8 chars): ")
    confirm_password = getpass("Confirm password: ")

    if len(password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    if password != confirm_password:
        print("Error: Passwords do not match.")
        sys.exit(1)

    create_admin(name, email, password)
