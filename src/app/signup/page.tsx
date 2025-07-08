"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile } from '@/lib/firebase';
import { COUNTRIES } from '@/lib/constants';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


const passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().regex(passwordRegex, "Password must be 8+ characters and include an uppercase letter, a lowercase letter, a number, and a special character."),
  confirmPassword: z.string(),
  country: z.string().min(1, "Please select a country."),
  birthday: z.date({ required_error: "A date of birth is required." }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      country: "",
      gender: "prefer_not_to_say",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(userCredential.user, { displayName: values.name });

      // Store additional details in localStorage
      const profileData = {
          phoneNumber: values.phoneNumber,
          country: values.country,
          birthday: values.birthday.toISOString(),
          gender: values.gender,
      };
      localStorage.setItem(`userProfile_${userCredential.user.uid}`, JSON.stringify(profileData));
      
      toast({ title: "Account Created!", description: "Welcome to Shravya Playhouse!" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Sign Up Successful!", description: "Welcome!" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error signing up with Google", error);
       if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Google Sign Up Failed",
          description: error.message || "Could not sign up with Google. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Join Shravya Playhouse today!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15.3 18.09C14.54 18.89 13.56 19.5 12.45 19.83C11.34 20.16 10.17 20.26 9 20.12C5.79 19.43 3.51 16.68 3.12 13.4C3.03 12.51 3.15 11.61 3.48 10.77C3.81 9.93 4.32 9.18 4.98 8.57C6.26 7.36 7.97 6.66 9.78 6.54C11.72 6.42 13.66 6.93 15.24 7.99L16.99 6.28C15.01 4.88 12.73 4.08 10.36 4.01C8.05 3.91 5.81 4.62 3.98 5.99C2.15 7.36 0.810001 9.32 0.200001 11.58C-0.419999 13.84 0.0300012 16.24 1.13 18.25C2.23 20.26 3.92 21.77 5.99 22.56C8.06 23.35 10.36 23.37 12.48 22.62C14.6 21.87 16.44 20.41 17.67 18.51L15.3 18.09Z"/><path d="M22.94 12.14C22.98 11.74 23 11.33 23 10.91C23 10.32 22.92 9.73 22.77 9.16H12V12.83H18.24C18.03 13.71 17.55 14.5 16.86 15.08L16.82 15.11L19.28 16.91L19.45 17.06C21.58 15.22 22.94 12.14 22.94 12.14Z"/><path d="M12 23C14.47 23 16.56 22.19 18.05 20.96L15.24 17.99C14.48 18.59 13.53 18.98 12.52 18.98C10.92 18.98 9.48001 18.13 8.82001 16.76L8.78001 16.72L6.21001 18.58L6.15001 18.7C7.02001 20.39 8.68001 21.83 10.62 22.48C11.09 22.64 11.56 22.77 12 22.81V23Z"/><path d="M12.01 3.00997C13.37 2.94997 14.7 3.43997 15.73 4.40997L17.97 2.21997C16.31 0.799971 14.21 -0.0600291 12.01 0.0099709C7.37001 0.0099709 3.44001 3.36997 2.02001 7.49997L4.98001 8.56997C5.60001 6.33997 7.72001 4.00997 10.22 4.00997C10.86 3.99997 11.49 4.12997 12.01 4.36997V3.00997Z"/></svg>
            Continue with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or fill out the form</span></div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+1 234 567 890" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormDescription className="text-xs">8+ characters, with uppercase, lowercase, number, and special character.</FormDescription><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="birthday" render={({ field }) => (
                <FormItem className="flex flex-col pt-2"><FormLabel>Date of birth</FormLabel><Popover>
                  <PopoverTrigger asChild><FormControl>
                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl></PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                  </PopoverContent>
                </Popover><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem><SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full md:col-span-2" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          Already have an account?&nbsp;
          <Link href="/login" className="underline">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
