from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# Base schema with common fields
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    is_active: bool = True


# Schema for creating a user
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


# Schema for updating a user
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


# Schema for reading a user (returned via API)
class UserSchema(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Schema for permission
class PermissionSchema(BaseModel):
    id: UUID
    name: str
    resource: str
    action: str

    class Config:
        from_attributes = True


# Schema for role
class RoleSchema(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    permissions: List[PermissionSchema] = []

    class Config:
        from_attributes = True


# Schema for user with roles
class UserWithRolesSchema(UserSchema):
    roles: List[RoleSchema] = []

    class Config:
        from_attributes = True
