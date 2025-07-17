
"use client";

import { useState, FormEvent, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { subYears, format, differenceInYears } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  updateProfile,
  type UserCredential,
  type User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  getAdditionalUserInfo,
} from '@/lib/firebase';
import { Loader2, CalendarIcon, Eye, EyeOff } from 'lucide-react';
import SyncDataDialog from '@/components/auth/sync-data-dialog';
import { getGuestData, clearGuestData } from '@/lib/sync';
import { syncGuestDataToProfile, getUserProfile, createUserProfile, checkUsernameUnique } from '@/lib/users';
import { COUNTRIES, COUNTRY_CODES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userForSync, setUserForSync] = useState<User | null>(null);

  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'enterPhone' | 'enterOtp'>('enterPhone');
  const [phoneDialogNumber, setPhoneDialogNumber] = useState('');
  const [phoneDialogCountryCode, setPhoneDialogCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const confirmationResultRef = useRef<any>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  // State and form for completing a profile after social/phone login
  const [completingUser, setCompletingUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const hasInitializedProfileForm = useRef(false);

  const profileFormSchema = useMemo(() => z.object({
    username: z.string()
      .min(3, "Username must be at least 3 characters.")
      .max(20, "Username must be 20 characters or less.")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
    name: z.string().min(2, "Name must be at least 2 characters."),
    country: z.string().min(1, "Please select a country."),
    birthday: z.date({ required_error: "A date of birth is required." })
      .refine((date) => date <= subYears(new Date(), 3), "You must be at least 3 years old."),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  }), []);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (completingUser && !hasInitializedProfileForm.current) {
      profileForm.reset({
        username: `${completingUser.displayName?.replace(/\s/g, '').toLowerCase() || 
                  (completingUser.phoneNumber ? `user_${completingUser.phoneNumber.slice(-4)}` : 'user')}_${Math.floor(1000 + Math.random() * 9000)}`,
        name: completingUser.displayName || '',
        country: 'India',
        gender: 'prefer_not_to_say',
      });
      hasInitializedProfileForm.current = true;
    } else if (!completingUser) {
      hasInitializedProfileForm.current = false;
    }
  }, [completingUser, profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
      if (!completingUser) return;
      setProfileLoading(true);

      const isUnique = await checkUsernameUnique(values.username);
      if (!isUnique) {
        profileForm.setError("username", {
          type: "manual",
          message: "This username is already taken. Please choose another.",
        });
        setProfileLoading(false);
        return;
      }

      try {
        await updateProfile(completingUser, { displayName: values.name });
        const additionalData = {
          username: values.username,
          country: values.country,
          birthday: values.birthday.toISOString(),
          gender: values.gender,
        };
        const guestData = getGuestData();
        await createUserProfile(completingUser, additionalData, guestData);
        if (guestData) clearGuestData();
        
        toast({ title: "Profile Complete!", description: "Welcome to Firebase Studio!" });
        setCompletingUser(null);
        router.push('/dashboard?new_user=true');
      } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
      } finally {
        setProfileLoading(false);
      }
  };


  const handleAuthError = (error: any) => {
    if (error.code === 'auth/popup-closed-by-user') {
      return;
    }
    console.error("Authentication error", error);
    toast({
      variant: "destructive",
      title: "Login Failed",
      description: error.message || "Please check your credentials and try again.",
    });
  };

  const processSuccessfulLogin = async (user: User) => {
    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
        // This is a new user signing up via a social provider on the login page.
        // They need to complete their profile.
        setCompletingUser(user);
        return;
    }
    
    const guestData = getGuestData();
    if (guestData) {
      setUserForSync(user);
      setIsSyncDialogOpen(true);
    } else {
      toast({ title: "Login Successful!", description: "Welcome back!" });
      router.push('/dashboard');
    }
  };

  const handleLoginAttempt = async (loginFunction: () => Promise<UserCredential>) => {
    setIsLoading(true);
    try {
      const userCredential = await loginFunction();
      await processSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const performEmailLogin = () => signInWithEmailAndPassword(auth, email, password);
  const performGoogleLogin = () => signInWithPopup(auth, googleProvider);

  const handleEmailLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLoginAttempt(performEmailLogin);
  };

  const handleGoogleLogin = () => {
    handleLoginAttempt(performGoogleLogin);
  };

  const handleSendOtp = async () => {
    if (!phoneDialogNumber) { toast({ variant: "destructive", title: "Phone number required" }); return; }
    if (!recaptchaContainerRef.current) {
        toast({ variant: 'destructive', title: 'reCAPTCHA Error', description: 'reCAPTCHA container not found.' });
        return;
    }
    setPhoneLoading(true);
    try {
      const fullPhoneNumber = `${phoneDialogCountryCode}${phoneDialogNumber}`;
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { 'size': 'invisible' });
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
      
      confirmationResultRef.current = confirmationResult;
      setPhoneStep('enterOtp');
      toast({ title: "OTP Sent!", description: `An OTP has been sent to ${fullPhoneNumber}` });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ variant: "destructive", title: "Failed to Send OTP", description: error.message });
    } finally { setPhoneLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResultRef.current) { toast({ variant: "destructive", title: "OTP Required" }); return; }
    setPhoneLoading(true);
    try {
      const userCredential = await confirmationResultRef.current.confirm(otp);
      setIsPhoneDialogOpen(false);
      await processSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({ variant: "destructive", title: "OTP Verification Failed", description: error.message });
    } finally { setPhoneLoading(false); }
  };

  const onKeepOnline = async () => {
    setIsSyncing(true);
    try {
        clearGuestData(); 
        toast({ title: "Login Successful!", description: "Your cloud data has been loaded." });
        router.push('/dashboard');
    } finally {
        setIsSyncing(false);
        setIsSyncDialogOpen(false);
    }
  };

  const onKeepLocal = async () => {
    if (!userForSync) return;
    setIsSyncing(true);
    try {
        const guestData = getGuestData();
        if (guestData) {
            await syncGuestDataToProfile(userForSync.uid, guestData);
        }
        clearGuestData();
        toast({ title: "Sync Complete!", description: "Your local progress has been saved to your account." });
        router.push('/dashboard');
    } finally {
        setIsSyncing(false);
        setIsSyncDialogOpen(false);
    }
  };

  return (
    <>
      <SyncDataDialog
        open={isSyncDialogOpen}
        onOpenChange={setIsSyncDialogOpen}
        onKeepOnline={onKeepOnline}
        onKeepLocal={onKeepLocal}
        isSyncing={isSyncing}
      />
       <Dialog open={!!completingUser} onOpenChange={(open) => !open && setCompletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Just a few more details to get you started on your adventure!
            </DialogDescription>
          </DialogHeader>
           <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 py-4">
              <FormField control={profileForm.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="Your unique username" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={profileForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={profileForm.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage /></FormItem>
              )} />
               <FormField control={profileForm.control} name="birthday" render={({ field }) => {
                 const age = field.value ? differenceInYears(new Date(), field.value) : null;
                 return (
                    <FormItem className="flex flex-col"><FormLabel>Date of birth</FormLabel><Popover>
                      <PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                           {field.value ? (
                            <span>{format(field.value, "PPP")} {age !== null && <span className="text-muted-foreground"> (Age: {age})</span>}</span>
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl></PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border" align="start">
                        <Calendar
                          mode="single" captionLayout="dropdown-buttons"
                          fromYear={1920} toYear={subYears(new Date(), 3).getFullYear()}
                          selected={field.value} onSelect={field.onChange}
                          disabled={(date) => date > subYears(new Date(), 3) || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover><FormMessage /></FormItem>
                 )
                }} />
               <FormField control={profileForm.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem><SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save & Continue"}
                </Button>
              </DialogFooter>
            </form>
           </Form>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>Log in to your account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="password">Password</Label>
                 <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                 </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log In"}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15.3 18.09C14.54 18.89 13.56 19.5 12.45 19.83C11.34 20.16 10.17 20.26 9 20.12C5.79 19.43 3.51 16.68 3.12 13.4C3.03 12.51 3.15 11.61 3.48 10.77C3.81 9.93 4.32 9.18 4.98 8.57C6.26 7.36 7.97 6.66 9.78 6.54C11.72 6.42 13.66 6.93 15.24 7.99L16.99 6.28C15.01 4.88 12.73 4.08 10.36 4.01C8.05 3.91 5.81 4.62 3.98 5.99C2.15 7.36 0.810001 9.32 0.200001 11.58C-0.419999 13.84 0.0300012 16.24 1.13 18.25C2.23 20.26 3.92 21.77 5.99 22.56C8.06 23.35 10.36 23.37 12.48 22.62C14.6 21.87 16.44 20.41 17.67 18.51L15.3 18.09Z"/><path d="M22.94 12.14C22.98 11.74 23 11.33 23 10.91C23 10.32 22.92 9.73 22.77 9.16H12V12.83H18.24C18.03 13.71 17.55 14.5 16.86 15.08L16.82 15.11L19.28 16.91L19.45 17.06C21.58 15.22 22.94 12.14 22.94 12.14Z"/><path d="M12 23C14.47 23 16.56 22.19 18.05 20.96L15.24 17.99C14.48 18.59 13.53 18.98 12.52 18.98C10.92 18.98 9.48001 18.13 8.82001 16.76L8.78001 16.72L6.21001 18.58L6.15001 18.7C7.02001 20.39 8.68001 21.83 10.62 22.48C11.09 22.64 11.56 22.77 12 22.81V23Z"/><path d="M12.01 3.00997C13.37 2.94997 14.7 3.43997 15.73 4.40997L17.97 2.21997C16.31 0.799971 14.21 -0.0600291 12.01 0.0099709C7.37001 0.0099709 3.44001 3.36997 2.02001 7.49997L4.98001 8.56997C5.60001 6.33997 7.72001 4.00997 10.22 4.00997C10.86 3.99997 11.49 4.12997 12.01 4.36997V3.00997Z"/></svg>
                Login with Google
              </Button>
               <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={isLoading}>Login with Phone</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Login with Phone</DialogTitle>
                    <DialogDescription>
                      {phoneStep === 'enterPhone' ? 'Enter your phone number to receive a verification code.' : 'Enter the OTP sent to your phone.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                  {phoneStep === 'enterPhone' ? (
                    <div className="flex items-start gap-2">
                       <Select onValueChange={setPhoneDialogCountryCode} defaultValue={phoneDialogCountryCode}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              {COUNTRY_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="tel" placeholder="123 456 7890" value={phoneDialogNumber} onChange={e => setPhoneDialogNumber(e.target.value)} />
                    </div>
                  ) : (
                    <Input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} />
                  )}
                  </div>
                  <DialogFooter>
                    {phoneStep === 'enterPhone' ? (
                       <Button onClick={handleSendOtp} disabled={phoneLoading}>
                        {phoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send OTP
                       </Button>
                    ) : (
                       <Button onClick={handleVerifyOtp} disabled={phoneLoading}>
                        {phoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify & Log In
                       </Button>
                    )}
                  </DialogFooter>
                   <div ref={recaptchaContainerRef}></div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
          <CardFooter className="text-center text-sm">
            Don&apos;t have an account?&nbsp;
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
