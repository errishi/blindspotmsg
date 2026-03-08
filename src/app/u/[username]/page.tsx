'use client';

import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardHeader, CardContent, Card } from '@/components/ui/card';
import { useCompletion } from '@ai-sdk/react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import * as z from 'zod';
import { ApiResponse } from '@/types/ApiResponse';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { messageSchema } from '@/schemas/messageSchema';
import { toast } from 'sonner';

const specialChar = '||';

const parseStringMessages = (messageString: string): string[] => {
  const normalized = (messageString ?? '').trim();
  if (!normalized) return [];

  const bySeparator = normalized
    .split(specialChar)
    .map((msg) => msg.trim())
    .filter(Boolean);

  if (bySeparator.length > 1) return bySeparator;

  // Fallback for providers that return newline or numbered lists.
  return normalized
    .split('\n')
    .map((msg) => msg.replace(/^\d+[.)-]\s*/, '').trim())
    .filter(Boolean);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

export default function SendMessage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [suggestedMessages, setSuggestedMessages] = useState<string[]>(
    parseStringMessages(initialMessageString),
  );

  const {
    complete,
    completion,
    isLoading: isSuggestLoading,
    error,
  } = useCompletion({
    api: '/api/suggest-messages',
    initialCompletion: initialMessageString,
    onFinish: (_prompt, completionText) => {
      const parsed = parseStringMessages(completionText ?? '');
      if (parsed.length > 0) {
        setSuggestedMessages(parsed);
      }
    },
  });

  useEffect(() => {
    const parsed = parseStringMessages(completion ?? '');
    if (parsed.length > 0) {
      setSuggestedMessages(parsed);
    }
  }, [completion]);

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  const messageContent = form.watch('content');

  const handleMessageClick = (message: string) => {
    form.setValue('content', message);
  };

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post<ApiResponse>('/api/send-message', {
        ...data,
        username,
      });

      toast(response.data.message);
      form.reset({ ...form.getValues(), content: '' });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ?? 'Failed to sent message',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedMessages = async () => {
    try {
      const prompt = 'Generate three anonymous message suggestions for a profile.';

      const generatedText = await complete(prompt);
      let parsed = parseStringMessages(generatedText ?? '');

      // Fallback for environments where complete() does not return the final text.
      if (parsed.length === 0) {
        const response = await fetch('/api/suggest-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggested messages');
        }

        const fallbackText = await response.text();
        parsed = parseStringMessages(fallbackText);
      }

      if (parsed.length === 0) {
        toast.error('No suggestions generated. Please try again.');
        return;
      }

      setSuggestedMessages(parsed);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Handle error appropriately
      toast.error('Failed to fetch message settings');
    }
  };

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Public Profile Link
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Send Anonymous Message to @{username}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your anonymous message here"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center">
            {isLoading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading || !messageContent}>
                Send It
              </Button>
            )}
          </div>
        </form>
      </Form>

      <div className="space-y-4 my-8">
        <div className="space-y-2">
          <Button
            onClick={fetchSuggestedMessages}
            className="my-4"
            disabled={isSuggestLoading}
          >
            Suggest Messages
          </Button>
          <p>Click on any message below to select it.</p>
        </div>
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Messages</h3>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            {error ? (
              <p className="text-red-500">{error.message}</p>
            ) : suggestedMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suggestions yet. Click Suggest Messages.</p>
            ) : (
              suggestedMessages.map((message, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="mb-2"
                  onClick={() => handleMessageClick(message)}
                >
                  {message}
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Separator className="my-6" />
      <div className="text-center">
        <div className="mb-4">Get Your Message Board</div>
        <Link href={'/sign-up'}>
          <Button>Create Your Account</Button>
        </Link>
      </div>
    </div>
  );
}