"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, confirmSignIn, signUp, confirmSignUp } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const client = generateClient<Schema>();

export default function LoginPage() {
    const router = useRouter();

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [name, setName] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");

    // UI State
    const [step, setStep] = useState<'LOGIN' | 'NEW_PASSWORD_REQUIRED' | 'SIGN_UP' | 'CONFIRM_SIGN_UP'>('LOGIN');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { getCurrentUser } = await import("aws-amplify/auth");
                await getCurrentUser();
                router.push("/dashboard");
            } catch (err) {
                // Not signed in, remain on login page
            }
        };
        checkUser();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { isSignedIn, nextStep } = await signIn({
                username: email,
                password,
            });

            if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
                setStep('NEW_PASSWORD_REQUIRED');
            } else if (isSignedIn) {
                // Verification Guard: Check if the user is approved in our database
                const profileResponse = await client.models.UserProfile.list({
                    filter: { email: { eq: email } }
                });

                const userProfile = profileResponse.data[0];

                if (userProfile && userProfile.status === "PENDING_APPROVAL") {
                    const { signOut } = await import("aws-amplify/auth");
                    await signOut();
                    setError("Your account is still pending approval from a Super Admin.");
                    toast.error("Access Denied", { description: "Account pending approval." });
                    setLoading(false);
                    return;
                } else if (userProfile && userProfile.status === "INACTIVE") {
                    const { signOut } = await import("aws-amplify/auth");
                    await signOut();
                    setError("Your account has been deactivated.");
                    toast.error("Access Denied", { description: "Account inactive." });
                    setLoading(false);
                    return;
                }

                toast.success("Signed in successfully!");
                router.push("/dashboard");
            } else {
                console.log("Next Step:", nextStep);
            }
        } catch (err: unknown) {
            console.error("Login error:", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to sign in. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { isSignedIn } = await confirmSignIn({
                challengeResponse: newPassword
            });

            if (isSignedIn) {
                router.push("/dashboard");
            }
        } catch (err: unknown) {
            console.error("New password error:", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to update password.");
            }
        } finally {
            setLoading(false);
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { isSignUpComplete, nextStep } = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                    }
                }
            });

            if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                setStep('CONFIRM_SIGN_UP');
                toast.info("Verification code sent to your email.");
            } else if (isSignUpComplete) {
                // Highly unlikely without confirmation but handling anyway
                handlePostSignUpDatabaseRegistry();
            }
        } catch (err: unknown) {
            console.error("Sign up error:", err);
            setError(err instanceof Error ? err.message : "Failed to sign up.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { isSignUpComplete } = await confirmSignUp({
                username: email,
                confirmationCode
            });

            if (isSignUpComplete) {
                await handlePostSignUpDatabaseRegistry();
            }
        } catch (err: unknown) {
            console.error("Confirmation error:", err);
            setError(err instanceof Error ? err.message : "Invalid confirmation code.");
        } finally {
            setLoading(false);
        }
    };

    const handlePostSignUpDatabaseRegistry = async () => {
        try {
            // Because they just signed up, they don't have a token to write via userPools yet.
            // But they do have a valid cognito user pool identity now. Let's try to sign them in so they can write.
            await signIn({ username: email, password });

            await client.models.UserProfile.create({
                email,
                name: name || email.split('@')[0],
                role: "ADMIN_PENDING",
                status: "PENDING_APPROVAL",
            });

            toast.success("Access Requested!", { description: "Your account is pending Super Admin approval." });
            setStep('LOGIN');
            // Log them back out since they are pending
            const { signOut } = await import("aws-amplify/auth");
            await signOut();
        } catch (err) {
            console.error("Database registration error:", err);
            setError("Created account but failed to request admin access. Please contact support.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl z-10 shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-foreground">
                        {step === 'LOGIN' ? 'Admin Access' : step === 'NEW_PASSWORD_REQUIRED' ? 'Set New Password' : step === 'SIGN_UP' ? 'Request Access' : 'Verify Email'}
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        {step === 'LOGIN'
                            ? 'Enter your credentials to access the control panel'
                            : step === 'NEW_PASSWORD_REQUIRED'
                                ? 'Please set a new password provided by your administrator'
                                : step === 'SIGN_UP'
                                    ? 'Apply for a new Admin panel account'
                                    : 'Enter the confirmation code sent to your email'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {step === 'LOGIN' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="pl-9 bg-background/50 border-white/10 focus:border-primary"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-9 bg-background/50 border-white/10 focus:border-primary"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? "Signing In..." : "Sign In"}
                            </Button>
                        </form>
                    ) : step === 'NEW_PASSWORD_REQUIRED' ? (
                        <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="Enter new strong password"
                                        className="pl-9 bg-background/50 border-white/10 focus:border-primary"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? "Updating..." : "Set Password & Login"}
                            </Button>
                        </form>
                    ) : step === 'SIGN_UP' ? (
                        <form onSubmit={handleSignUp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className="bg-background/50 border-white/10 focus:border-primary"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="pl-9 bg-background/50 border-white/10 focus:border-primary"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-9 bg-background/50 border-white/10 focus:border-primary"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? "Requesting..." : "Submit Request"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleConfirmSignUp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Confirmation Code</Label>
                                <div className="relative">
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="123456"
                                        className="bg-background/50 border-white/10 focus:border-primary"
                                        value={confirmationCode}
                                        onChange={(e) => setConfirmationCode(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? "Verifying..." : "Verify & Complete Request"}
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center border-t border-white/10 pt-4">
                    {step === 'LOGIN' ? (
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setStep('SIGN_UP')}>Request Access</Button>
                        </p>
                    ) : (
                        <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground" onClick={() => setStep('LOGIN')}>Back to Login</Button>
                    )}
                </CardFooter>

                {step === 'LOGIN' && (
                    <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                        <p>Protected by AWS Cognito</p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
