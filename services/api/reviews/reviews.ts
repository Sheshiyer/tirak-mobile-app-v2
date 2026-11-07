import axios from 'axios';
import {apiUrl} from '@/constants/api';
import {getAuthToken} from '@/services/api/companion/companion';

export interface CreateReviewInput {bookingId:string; companionId:string; rating:number; comment:string;}
export async function createReview(input:CreateReviewInput):Promise<void> {
  if (!Number.isInteger(input.rating) || input.rating<1 || input.rating>5 || input.comment.length>1000 || !input.bookingId || !input.companionId) throw new Error('Choose a rating from 1 to 5 and keep your comment within 1000 characters.');
  const token=await getAuthToken();
  if (!token) throw new Error('Please sign in before submitting a review.');
  const response=await axios.post(apiUrl('/api/reviews'),input,{headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}});
  if (response.data?.success!==true) throw new Error(response.data?.message || 'Unable to submit your review. Please try again.');
}
