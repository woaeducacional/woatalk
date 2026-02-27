import { Request, Response } from "express";
import { communityService } from "../services/community.service";

class CommunityController {
  async createPost(req: Request, res: Response) {
    const { userId, content } = req.body;

    const { data, error } = await communityService.createPost(
      userId,
      content
    );

    return res.status(200).json({ data, error });
  }

  async likePost(req: Request, res: Response) {
    const postId = req.params.postId as string;
    const { userId } = req.body;

    const { data, error } = await communityService.likePost(
      postId,
      userId
    );

    return res.status(200).json({ data, error });
  }

  async commentOnPost(req: Request, res: Response) {
    const postId = req.params.postId as string;
    const { userId, comment } = req.body;

    const { data, error } = await communityService.commentOnPost(
      postId,
      userId,
      comment
    );

    return res.status(200).json({ data, error });
  }

  async followUser(req: Request, res: Response) {
    const { followerId, followingId } = req.body;

    const { data, error } = await communityService.followUser(
      followerId,
      followingId
    );

    return res.status(200).json({ data, error });
  }

  async getFeed(req: Request, res: Response) {
    const { data, error } = await communityService.getFeed();

    return res.status(200).json({ data, error });
  }

  async getFollowers(req: Request, res: Response) {
    const userId = req.params.userId as string;

    const { data, error } = await communityService.getFollowers(userId);

    return res.status(200).json({ data, error });
  }

  async getFollowing(req: Request, res: Response) {
    const userId = req.params.userId as string;

    const { data, error } = await communityService.getFollowing(userId);

    return res.status(200).json({ data, error });
  }
}

export const communityController = new CommunityController();