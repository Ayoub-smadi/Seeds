import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useRegisterUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { t, lang } = useTranslation();
  const [_, setLocation] = useLocation();
  
  const { mutate: registerUser, isPending, error } = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("bazour_token", data.token);
        setLocation("/");
        window.location.reload();
      }
    }
  });

  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-md w-full bg-card p-8 rounded-3xl shadow-xl border border-border">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-display font-bold">{t('create_account')}</h2>
          <p className="text-muted-foreground mt-2">{lang === 'ar' ? 'انضم إلى مجتمعنا النباتي' : 'Join our botanical community'}</p>
        </div>

        <form onSubmit={handleSubmit((data) => registerUser({ data }))} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('name')}</label>
            <input {...register("name")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('email')}</label>
            <input type="email" {...register("email")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('phone')}</label>
            <input {...register("phone")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('password')}</label>
            <input type="password" {...register("password")} className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-background" />
          </div>
          
          {error && <p className="text-destructive text-sm text-center">Error creating account</p>}

          <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl text-lg mt-4">
            {isPending ? "..." : t('create_account')}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t('have_account')} <Link href="/auth/login" className="font-bold text-primary hover:underline">{t('sign_in')}</Link>
        </p>
      </div>
    </div>
  );
}
