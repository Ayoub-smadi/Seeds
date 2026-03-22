import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useLoginUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();
  
  const { mutate: login, isPending, error } = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("bazour_token", data.token);
        setLocation(data.user.role === 'admin' ? "/admin" : "/");
        window.location.reload(); // Quick refresh to update user state globally
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
            <Leaf className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-display font-bold">{t('sign_in')}</h2>
          <p className="text-muted-foreground mt-2">Welcome back to Bazour Store</p>
        </div>

        <form onSubmit={handleSubmit((data) => login({ data }))} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('email')}</label>
            <input 
              {...register("email")} 
              className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-background" 
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('password')}</label>
            <input 
              type="password"
              {...register("password")} 
              className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-background" 
            />
          </div>
          
          {error && <p className="text-destructive text-sm text-center">{error.message || "Invalid credentials"}</p>}

          <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl text-lg">
            {isPending ? "..." : t('sign_in')}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t('no_account')} <Link href="/auth/register" className="font-bold text-primary hover:underline">{t('create_account')}</Link>
        </p>
      </div>
    </div>
  );
}
