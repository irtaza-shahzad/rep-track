from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)

    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        password = password_bytes.decode('utf-8', errors='ignore')

    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not isinstance(plain, str):
        plain = str(plain)

    plain_bytes = plain.encode('utf-8')
    if len(plain_bytes) > 72:
        plain_bytes = plain_bytes[:72]
        plain = plain_bytes.decode('utf-8', errors='ignore')

    return pwd_context.verify(plain, hashed)
