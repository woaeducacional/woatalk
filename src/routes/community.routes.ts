import express from "express";
import { communityController } from "../controllers/community.controller";

const router = express.Router();

router.post("/posts", communityController.createPost);
router.post("/posts/:postId/like", communityController.likePost);
router.post("/posts/:postId/comment", communityController.commentOnPost);
router.post("/follow", communityController.followUser);
router.get("/feed", communityController.getFeed);
router.get("/followers/:userId", communityController.getFollowers);
router.get("/following/:userId", communityController.getFollowing);

export default router;