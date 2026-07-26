"use client";

import { useState } from "react";
import { publicLeadSchema } from "@/lib/validations/lead.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const parseResult = publicLeadSchema.safeParse(formData);
    
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parseResult.data),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit lead");
      }

      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
      toast.success("Thank you! We have received your enquiry.");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <section id="lead-form" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Let&apos;s talk
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Turn your enquiry into an opportunity.
            </p>
            <ul className="mt-8 space-y-4 text-muted-foreground">
              <li className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-primary font-bold">✓</span>
                </div>
                Fast response
              </li>
              <li className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-primary font-bold">✓</span>
                </div>
                Secure submission
              </li>
              <li className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-primary font-bold">✓</span>
                </div>
                Simple process
              </li>
            </ul>
          </div>
          
          <Card className="w-full max-w-lg mx-auto lg:mx-0 shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                    <span className="text-emerald-500 text-3xl">✓</span>
                  </div>
                  <h3 className="text-xl font-bold">Message Sent!</h3>
                  <p className="text-muted-foreground">We&apos;ll be in touch with you shortly.</p>
                  <Button onClick={() => setSuccess(false)} variant="outline" className="mt-4">
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleChange} disabled={loading} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} disabled={loading} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} disabled={loading} />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="Acme Inc." value={formData.company} onChange={handleChange} disabled={loading} />
                      {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" placeholder="How can we help you?" className="min-h-25" value={formData.message} onChange={handleChange} disabled={loading} />
                    {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Lead"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
