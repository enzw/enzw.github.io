export const MALE_AVATARS = ["🐻", "🐶", "🐧", "🦊", "🐼"] as const
export const FEMALE_AVATARS = ["🐰", "🐱", "🐹", "🐥", "🦋"] as const
export const PROFILE_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS] as const
export const PROFILE_THEME_STORAGE_KEY = "wangwang-profile-theme"

export type AvatarEmoji = (typeof PROFILE_AVATARS)[number]
export type ProfileTheme = "male" | "female"

export function isMaleAvatar(avatar: AvatarEmoji | null | undefined) {
  return avatar
    ? (MALE_AVATARS as readonly AvatarEmoji[]).includes(avatar)
    : false
}

export function profileThemeForAvatar(
  avatar: AvatarEmoji | null | undefined,
): ProfileTheme {
  return isMaleAvatar(avatar) ? "male" : "female"
}
