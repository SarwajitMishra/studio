
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GAMES, MATH_PUZZLE_TYPES, ENGLISH_PUZZLE_TYPES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const allGames = [
    ...GAMES.filter(g => !g.disabled && !['number-puzzles', 'easy-english'].includes(g.id)),
    ...MATH_PUZZLE_TYPES,
    ...ENGLISH_PUZZLE_TYPES,
];

const gameFeedbackSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  notPlayed: z.boolean().optional(),
  comment: z.string().max(200, "Comment is too long").optional(),
}).optional();

const formSchema = z.object({
  gameFeedback: z.record(gameFeedbackSchema),
  layoutRating: z.number().min(1).max(5),
  uiFeelRating: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  overallComment: z.string().min(10, "Please provide a bit more detail.").max(500, "Overall comment is too long"),
});

type FormData = z.infer<typeof formSchema>;

const StarRatingInput = ({ value, onChange }: { value?: number, onChange: (value: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          "cursor-pointer transition-colors",
          value && value >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        )}
        onClick={() => onChange(star)}
      />
    ))}
  </div>
);

export default function FeedbackForm() {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameFeedback: {},
      layoutRating: 0,
      uiFeelRating: 0,
      overallRating: 0,
      overallComment: '',
    },
  });

  const { control, handleSubmit, watch } = form;

  const onSubmit = (data: FormData) => {
    let emailBody = "Shravya Playhouse Feedback\n============================\n\n";

    emailBody += "--- Game Specific Feedback ---\n\n";
    allGames.forEach(game => {
      const feedback = data.gameFeedback[game.id];
      if (feedback) {
        emailBody += `Game: ${game.title || game.name}\n`;
        if (feedback.notPlayed) {
          emailBody += "Status: Not Played\n";
        } else {
          emailBody += `Rating: ${feedback.rating || 'N/A'} / 5\n`;
          if (feedback.comment) {
            emailBody += `Comment: ${feedback.comment}\n`;
          }
        }
        emailBody += "\n";
      }
    });

    emailBody += "--- Overall Experience ---\n\n";
    emailBody += `Layout & Design Rating: ${data.layoutRating} / 5\n`;
    emailBody += `UI Feel & Responsiveness Rating: ${data.uiFeelRating} / 5\n`;
    emailBody += `Overall App Rating: ${data.overallRating} / 5\n`;
    emailBody += `Overall Comment: ${data.overallComment}\n`;
    
    const mailtoLink = `mailto:help.shravyaplayhouse@gmail.com?subject=Shravya Playhouse Feedback&body=${encodeURIComponent(emailBody)}`;
    
    window.location.href = mailtoLink;

    toast({
        title: "Thank you for your feedback!",
        description: "Your email client should now open with your feedback pre-filled.",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Game Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            {allGames.map(game => {
                const notPlayedValue = watch(`gameFeedback.${game.id}.notPlayed`);
                return (
                    <div key={game.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold text-lg">{game.title || game.name}</Label>
                            <div className="flex items-center space-x-2">
                                <Controller
                                    control={control}
                                    name={`gameFeedback.${game.id}.notPlayed`}
                                    render={({ field }) => (
                                        <Checkbox
                                            id={`notPlayed-${game.id}`}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                                <Label htmlFor={`notPlayed-${game.id}`}>I haven't played this</Label>
                            </div>
                        </div>

                        {!notPlayedValue && (
                           <div className="space-y-3 pl-2 border-l-2 ml-2">
                                <div className="flex items-center gap-4">
                                    <Label>Rating:</Label>
                                    <Controller
                                        control={control}
                                        name={`gameFeedback.${game.id}.rating`}
                                        render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
                                    />
                                </div>
                                <Controller
                                    control={control}
                                    name={`gameFeedback.${game.id}.comment`}
                                    render={({ field }) => (
                                        <Textarea placeholder="Any comments on this game?" {...field} />
                                    )}
                                />
                           </div>
                        )}
                    </div>
                )
            })}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Overall Experience</CardTitle></CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <Label className="font-semibold">Layout & Design:</Label>
                <Controller
                    control={control}
                    name="layoutRating"
                    render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
                />
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <Label className="font-semibold">UI Feel & Responsiveness:</Label>
                 <Controller
                    control={control}
                    name="uiFeelRating"
                    render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
                />
            </div>
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <Label className="font-semibold">Overall App Rating:</Label>
                 <Controller
                    control={control}
                    name="overallRating"
                    render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
                />
            </div>
            <Separator />
            <div>
                <Label htmlFor="overallComment" className="font-semibold">Any other comments or suggestions?</Label>
                <Controller
                    control={control}
                    name="overallComment"
                    render={({ field }) => (
                        <Textarea id="overallComment" placeholder="We'd love to hear your thoughts..." {...field} className="mt-2" />
                    )}
                />
                {form.formState.errors.overallComment && <p className="text-sm text-destructive mt-1">{form.formState.errors.overallComment.message}</p>}
            </div>
        </CardContent>
      </Card>
      
      <Button type="submit" className="w-full text-lg">Submit Feedback via Email</Button>
    </form>
  );
}
