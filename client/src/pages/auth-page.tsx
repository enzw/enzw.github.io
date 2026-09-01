import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/auth-context"
import { zodResolver } from "@/lib/form-resolver"
import { api, errorMessage } from "@/services/api"
import type { User } from "@/types/finance"

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { setUser } = useAuth()
  const [error, setError] = useState("")
  const schema = z.object({
    name:
      mode === "register"
        ? z.string().min(2, "Nama minimal 2 karakter")
        : z.string(),
    email: z.string().email("Masukkan email yang valid"),
    password: z
      .string()
      .min(
        mode === "register" ? 8 : 1,
        mode === "register"
          ? "Minimal 8 karakter"
          : "Kata sandi wajib diisi",
      ),
  })
  type AuthValues = z.infer<typeof schema>

  const form = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const submit = async (values: AuthValues) => {
    setError("")
    try {
      const payload =
        mode === "register"
          ? values
          : { email: values.email, password: values.password }
      const { data } = await api.post<{ user: User }>(
        `/auth/${mode}`,
        payload,
      )
      setUser(data.user)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <FieldGroup className="gap-4">
        {mode === "register" && (
          <Field data-invalid={Boolean(form.formState.errors.name)}>
            <FieldLabel htmlFor={`${mode}-name`}>Nama</FieldLabel>
            <Input
              id={`${mode}-name`}
              placeholder="Nama lengkap"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
        )}
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor={`${mode}-email`}>Email</FieldLabel>
          <Input
            id={`${mode}-email`}
            type="email"
            placeholder="nama@email.com"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor={`${mode}-password`}>Kata sandi</FieldLabel>
          <Input
            id={`${mode}-password`}
            type="password"
            placeholder={
              mode === "register" ? "Minimal 8 karakter" : "Kata sandi"
            }
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>
        {error && (
          <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ArrowRight />
          )}
          {mode === "login" ? "Masuk ke WangWang" : "Buat akun"}
        </Button>
      </FieldGroup>
    </form>
  )
}

export function AuthPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Brand className="[&_span:first-child]:bg-white/15" />
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-primary-foreground/70">
            Personal finance, made clear
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-tight">
            Uang lebih terarah.
            <br />
            Hidup lebih tenang.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-primary-foreground/75">
            Susun rencana tabungan, kendalikan pengeluaran, dan pahami kondisi
            keuanganmu dalam satu tempat.
          </p>
          <div className="mt-10 grid gap-3">
            {[
              "Ringkasan bulanan otomatis",
              "Budget dan tabungan saling terhubung",
              "Data milikmu tetap terpisah dan aman",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle2 className="size-5" />
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-primary-foreground/60">
          WangWang · Bukan cuma mencatat uang keluar.
        </p>
      </section>
      <section className="grid place-items-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <Brand className="mb-8 lg:hidden" />
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Selamat datang</CardTitle>
              <CardDescription>
                Mulai rapikan keuanganmu hari ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="mb-6 grid w-full grid-cols-2">
                  <TabsTrigger value="login">Masuk</TabsTrigger>
                  <TabsTrigger value="register">Daftar</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <AuthForm mode="login" />
                </TabsContent>
                <TabsContent value="register">
                  <AuthForm mode="register" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
