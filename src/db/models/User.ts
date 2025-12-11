import { Schema, model, Document } from "mongoose";
import { emailRegexp } from "../../constants/auth.constants.js";
import { handleSaveError, setUpdateSettings } from "../hooks.js";

export interface UserDocument extends Document {
  email: string;
  fullName: string;
  username: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;

  avatarURL?: string;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      match: emailRegexp,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    accessToken: { type: String },
    refreshToken: { type: String },

    avatarURL: { type: String },
  },
  { versionKey: false, timestamps: true },
);

userSchema.post("save", handleSaveError);
userSchema.pre("findOneAndUpdate", setUpdateSettings);
userSchema.post("findOneAndUpdate", handleSaveError);

const User = model<UserDocument>("user", userSchema);

export default User;
