import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Camera, Check, Loader2, Palette, UserRound } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/auth-context"
import { zodResolver } from "@/lib/form-resolver"
import {
  FEMALE_AVATARS,
  isMaleAvatar,
  MALE_AVATARS,
  type AvatarEmoji,
} from "@/lib/profile"
import { api, errorMessage } from "@/services/api"
import type { User } from "@/types/finance"

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60),
})

type Values = z.infer<typeof schema>

function AvatarGroup({
  label,
  description,
  avatars,
  selected,
  onSelect,
}: {
  label: string
  description: string
  avatars: readonly AvatarEmoji[]
  selected: AvatarEmoji | null
  onSelect: (avatar: AvatarEmoji) => void
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary">5 pilihan</Badge>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {avatars.map((avatar) => {
          const active = selected === avatar
          return (
            <Button
              key={avatar}
              type="button"
              variant={active ? "default" : "outline"}
              className="relative size-12 rounded-2xl p-0 text-2xl sm:size-14"
              aria-label={`Pilih avatar ${avatar}`}
              aria-pressed={active}
              onClick={() => onSelect(avatar)}
            >
              {avatar}
              {active && (
                <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-foreground text-background ring-2 ring-background">
                  <Check className="size-3" />
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </section>
  )
}

export function SettingsPage() {
  const { user, setUser } = useAuth()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [avatarEmoji, setAvatarEmoji] = useState<AvatarEmoji | null>(
    user?.avatarEmoji ?? null,
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "" },
  })

  if (!user) return null

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const maleTheme = isMaleAvatar(avatarEmoji)

  const selectAvatar = (avatar: AvatarEmoji) => {
    setAvatarEmoji(avatar)
    setPickerOpen(false)
  }

  const submit = async (values: Values) => {
    try {
      const { data } = await api.patch<{ user: User }>("/auth/profile", {
        name: values.name,
        avatarEmoji,
      })
      setUser(data.user)
      form.reset({ name: data.user.name })
      toast.success("Profil berhasil diperbarui")
    } catch (cause) {
      toast.error("Gagal memperbarui profil", {
        description: errorMessage(cause),
      })
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Pengaturan profil"
        description="Atur nama, avatar, dan tema personal WangWang kamu."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Klik avatar untuk memilih karakter yang kamu suka.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(submit)}>
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel>Avatar</FieldLabel>
                  <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                    <DialogTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          className="relative size-24 rounded-full p-0"
                          aria-label="Ganti avatar"
                        />
                      }
                    >
                      <Avatar className="size-20">
                        <AvatarFallback
                          className={avatarEmoji ? "text-4xl" : "text-xl"}
                        >
                          {avatarEmoji ?? initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute right-0 bottom-1 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
                        <Camera className="size-4" />
                      </span>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Pilih avatar</DialogTitle>
                        <DialogDescription>
                          Avatar juga menentukan warna tema profilmu.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 pt-2">
                        <AvatarGroup
                          label="Cowok"
                          description="Tema olive dan amber"
                          avatars={MALE_AVATARS}
                          selected={avatarEmoji}
                          onSelect={selectAvatar}
                        />
                        <AvatarGroup
                          label="Cewek"
                          description="Tema taupe dan pink saat ini"
                          avatars={FEMALE_AVATARS}
                          selected={avatarEmoji}
                          onSelect={selectAvatar}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <FieldDescription>
                    {avatarEmoji
                      ? `Avatar ${avatarEmoji} dipilih dengan tema ${maleTheme ? "olive-amber" : "taupe-pink"}.`
                      : "Belum memilih avatar. Tema saat ini tetap digunakan."}
                  </FieldDescription>
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldLabel htmlFor="profile-name">Nama</FieldLabel>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                  <Input id="profile-email" value={user.email} readOnly />
                  <FieldDescription>
                    Email akun tidak dapat diubah dari halaman ini.
                  </FieldDescription>
                </Field>
                <Button
                  type="submit"
                  className="w-fit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="animate-spin" />
                  )}
                  Simpan perubahan
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <span className="mb-2 grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Palette className="size-5" />
            </span>
            <CardTitle>Tema avatar</CardTitle>
            <CardDescription>
              Warna tema mengikuti kelompok avatar setelah profil disimpan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-3">
              <span className="flex items-center gap-2">
                <UserRound className="size-4" /> Tema terpilih
              </span>
              <Badge>{maleTheme ? "Cowok" : "Cewek"}</Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Mode terang atau gelap tetap mengikuti pengaturan sistem perangkatmu.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
