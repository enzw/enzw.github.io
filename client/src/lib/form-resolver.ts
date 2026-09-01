import { zodResolver as createZodResolver } from "@hookform/resolvers/zod"
import type { FieldValues, Resolver } from "react-hook-form"
import type { ZodType } from "zod"

export function zodResolver<TOutput extends FieldValues>(schema: ZodType<TOutput>) {
  return createZodResolver(schema as never) as unknown as Resolver<TOutput>
}
