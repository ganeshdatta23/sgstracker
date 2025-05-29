"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { updateLocation } from '@/app/admin/actions';

const formSchema = z.object({
  urlOrCoords: z.string().min(3, { message: "Google Maps URL or Coordinates (lat,lng) are required." }),
  addressName: z.string().optional(),
  secretToken: z.string().min(1, { message: "Secret token is required." }),
});

type AdminLocationFormValues = z.infer<typeof formSchema>;

export default function AdminLocationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<AdminLocationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urlOrCoords: '',
      addressName: '',
      secretToken: '',
    },
  });

  async function onSubmit(values: AdminLocationFormValues) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('urlOrCoords', values.urlOrCoords);
      formData.append('addressName', values.addressName || '');
      formData.append('secretToken', values.secretToken);

      const result = await updateLocation(formData);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: "Success",
        description: result.message,
      });
      
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to update location',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin /> Update Swamiji's Location
        </CardTitle>
        <CardDescription>
          Enter a Google Maps URL or direct coordinates (latitude,longitude) to update the location.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="urlOrCoords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="urlOrCoords">Google Maps URL or Coordinates (lat,lng)</FormLabel>
                  <FormControl>
                    <Input id="urlOrCoords" placeholder="e.g., https://maps.google.com/... or 12.345,67.890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="addressName">Location Name (Optional)</FormLabel>
                  <FormControl>
                    <Input id="addressName" placeholder="e.g., SGS Ashram, Mysuru" {...field} />
                  </FormControl>
                  <FormDescription>A human-readable name for the location.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secretToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="secretToken">Secret Token</FormLabel>
                  <FormControl>
                    <Input id="secretToken" type="password" placeholder="Enter admin token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Location
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
