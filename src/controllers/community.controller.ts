import { NextRequest, NextResponse } from "next/server";
import { communityService } from "../services/community.service";

export async function createPost(request: NextRequest) {
  const { userId, content } = await request.json();

  const { data, error } = await communityService.createPost(
    userId,
    content
  );

  return NextResponse.json({ data, error }, { status: 200 });
}

export async function likePost(request: NextRequest, { params }: { params: { postId: string } }) {
  const { userId } = await request.json();
  const postId = params.postId;

  const { data, error } = await communityService.likePost(
    postId,
    userId
  );

  return NextResponse.json({ data, error }, { status: 200 });
}

export async function commentOnPost(request: NextRequest, { params }: { params: { postId: string } }) {
  const { userId, comment } = await request.json();
  const postId = params.postId;

  const { data, error } = await communityService.commentOnPost(
    postId,
    userId,
    comment
  );

  return NextResponse.json({ data, error }, { status: 200 });
}

export async function followUser(request: NextRequest) {
  const { followerId, followingId } = await request.json();

  const { data, error } = await communityService.followUser(
    followerId,
    followingId
  );

  return NextResponse.json({ data, error }, { status: 200 });
}

export async function getFeed(request: NextRequest) {
  const { data, error } = await communityService.getFeed();

  return NextResponse.json({ data, error }, { status: 200 });
}

export async function getFollowers(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = params.userId;

  const { data, error } = await communityService.getFollowers(userId);

  return NextResponse.json({ data, error }, { status: 200 });
}

export async function getFollowing(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = params.userId;

  const { data, error } = await communityService.getFollowing(userId);

  return NextResponse.json({ data, error }, { status: 200 });
}