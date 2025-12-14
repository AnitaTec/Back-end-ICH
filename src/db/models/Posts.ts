import { Schema, model } from "mongoose";

const postsSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
    image: { type: String, required: true },
    caption: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

const Posts = model("post", postsSchema);

export default Posts;
