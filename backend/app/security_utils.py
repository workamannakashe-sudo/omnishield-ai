import os
import hashlib
import base64
from typing import Tuple
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes

# AES-256-GCM parameters
KEY_SIZE = 32 # 256 bits
IV_SIZE = 12  # 96 bits GCM standard
TAG_SIZE = 16 # 128 bits GCM standard

def generate_aes_key() -> bytes:
    return os.urandom(KEY_SIZE)

def encrypt_aes_gcm(plaintext: bytes, key: bytes) -> Tuple[bytes, bytes, bytes]:
    """
    Encrypts plaintext using AES-256-GCM.
    Returns: (ciphertext, iv, tag)
    """
    iv = os.urandom(IV_SIZE)
    encryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
    ).encryptor()
    
    ciphertext = encryptor.update(plaintext) + encryptor.finalize()
    return ciphertext, iv, encryptor.tag

def decrypt_aes_gcm(ciphertext: bytes, key: bytes, iv: bytes, tag: bytes) -> bytes:
    """
    Decrypts ciphertext using AES-256-GCM.
    """
    decryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv, tag),
    ).decryptor()
    
    return decryptor.update(ciphertext) + decryptor.finalize()

# RSA-2048 keypair generation helpers
def generate_rsa_keypair() -> Tuple[str, str]:
    """
    Generates a private and public RSA-2048 keypair.
    Returns: (private_key_pem, public_key_pem)
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
    
    return private_pem, public_pem

def verify_rsa_signature(public_key_pem: str, data: bytes, signature_b64: str) -> bool:
    """
    Verifies that data was signed by the center's private key matching public_key_pem.
    """
    try:
        public_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))
        signature = base64.b64decode(signature_b64)
        
        public_key.verify(
            signature,
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception as e:
        print(f"RSA Signature verification failed: {e}")
        return False

def sign_with_rsa(private_key_pem: str, data: bytes) -> str:
    """
    Signs data using private RSA key. Returns base64 encoded signature.
    """
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None
    )
    
    signature = private_key.sign(
        data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    return base64.b64encode(signature).decode('utf-8')

# SHA-256 integrity helpers
def calculate_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def seal_paper_blob(paper_json_str: str) -> Tuple[str, str, str]:
    """
    Encrypts paper JSON, generates AES key, calculations check hashes.
    Returns: (encrypted_blob_b64, aes_key_b64, sha256_hash)
    """
    aes_key = generate_aes_key()
    ciphertext, iv, tag = encrypt_aes_gcm(paper_json_str.encode('utf-8'), aes_key)
    
    # Pack IV and Tag into the blob to make it easy to transfer
    # Format: Base64(IV) + ":" + Base64(Tag) + ":" + Base64(Ciphertext)
    iv_b64 = base64.b64encode(iv).decode('utf-8')
    tag_b64 = base64.b64encode(tag).decode('utf-8')
    cipher_b64 = base64.b64encode(ciphertext).decode('utf-8')
    
    blob = f"{iv_b64}:{tag_b64}:{cipher_b64}"
    
    # Calculate sha256 of the sealed blob for audit integrity
    sha_hash = calculate_sha256(blob.encode('utf-8'))
    
    return blob, base64.b64encode(aes_key).decode('utf-8'), sha_hash

def encrypt_with_rsa(public_key_pem: str, plaintext: bytes) -> str:
    """
    Encrypts data using the center's PEM public RSA key. Returns base64 encoded string.
    """
    public_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))
    ciphertext = public_key.encrypt(
        plaintext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return base64.b64encode(ciphertext).decode('utf-8')

