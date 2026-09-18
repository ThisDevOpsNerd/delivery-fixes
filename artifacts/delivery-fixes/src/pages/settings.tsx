import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Settings2, MessageSquare, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  enabled: z.boolean(),
  autoResolveAddress: z.boolean(),
  askForPhoto: z.boolean(),
  customerMessage: z.string().min(10, "Message must be at least 10 characters"),
});

export function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      enabled: false,
      autoResolveAddress: false,
      askForPhoto: false,
      customerMessage: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        enabled: settings.enabled,
        autoResolveAddress: settings.autoResolveAddress,
        askForPhoto: settings.askForPhoto,
        customerMessage: settings.customerMessage,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettings.mutate({ data: values }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetSettingsQueryKey(), updated);
        toast({
          title: "Settings saved",
          description: "Your automation settings have been updated.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <Card className="p-6 space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Automation Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg">Configure self-serve customer messaging and rules.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card className="overflow-hidden border shadow-sm">
            <div className="bg-secondary p-5 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-background shadow-sm text-primary rounded-lg border border-border/50">
                <Settings2 className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-lg">Core Features</h2>
            </div>
            <div className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-5 bg-background shadow-sm hover:border-primary/30 transition-colors">
                    <div className="space-y-1.5 mr-6">
                      <FormLabel className="text-base font-bold">Enable Delivery Fixes</FormLabel>
                      <FormDescription className="text-sm font-medium text-muted-foreground">
                        Turn on the integration to intercept delivery failures and notify customers.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoResolveAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-5 bg-background shadow-sm hover:border-primary/30 transition-colors">
                    <div className="space-y-1.5 mr-6">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-base font-bold">Auto-resolve Address Corrections</FormLabel>
                        <Zap className="w-4 h-4 text-primary fill-primary/20" />
                      </div>
                      <FormDescription className="text-sm font-medium text-muted-foreground">
                        Automatically update Shopify orders when a customer provides a corrected address.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="askForPhoto"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-5 bg-background shadow-sm hover:border-primary/30 transition-colors">
                    <div className="space-y-1.5 mr-6">
                      <FormLabel className="text-base font-bold">Request Proof of Damage</FormLabel>
                      <FormDescription className="text-sm font-medium text-muted-foreground">
                        Prompt customers to upload a photo when a carrier reports package damage.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Card className="overflow-hidden border shadow-sm">
            <div className="bg-secondary p-5 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-background shadow-sm text-primary rounded-lg border border-border/50">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-lg">Customer Communications</h2>
            </div>
            <div className="p-6">
              <FormField
                control={form.control}
                name="customerMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-base">Self-serve Portal Message</FormLabel>
                    <FormDescription className="mb-4 font-medium text-muted-foreground">
                      This text appears at the top of the portal when a customer clicks the tracking link to fix an issue.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Hi there, we noticed an issue with your delivery..."
                        className="min-h-[160px] resize-y text-base p-4 font-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <div className="flex justify-end pt-2 pb-10">
            <Button 
              type="submit" 
              size="lg"
              className="px-10 shadow-md font-bold text-base h-12"
              disabled={updateSettings.isPending || !form.formState.isDirty}
            >
              {updateSettings.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}