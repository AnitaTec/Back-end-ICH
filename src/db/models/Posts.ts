import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    likes: { type: [Schema.Types.ObjectId], ref: "user", default: [] },
    likesCount: { type: Number, default: 0 },
  },
  { _id: true, versionKey: false },
);

const postsSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
    image: { type: String, required: true },
    caption: { type: String, default: "" },

    likes: { type: [Schema.Types.ObjectId], ref: "user", default: [] },
    likesCount: { type: Number, default: 0 },

    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

const Posts = model("post", postsSchema);

export default Posts;
