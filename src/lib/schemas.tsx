import * as z from "zod";

export const getCompanySchema = (t: (value: string) => string) => {
  return z.object({
    id: z.string().min(1, t("invalidId")),
    name: z.string().min(1, t("invalidName")),
    tin: z
      .string()
      .length(10, t("invalidTin"))
      .refine((data) => /^\d+$/.test(data), {
        message: t("numericTin"),
      }),
    imageId: z.string().optional(),
    description: z.string().min(50, t("invalidDescription")),
    descriptionRu: z.string().optional(),
    slogan: z.string().optional(),
    sloganRu: z.string().optional(),
  });
};

export const getStockSchema = (t: (value: string) => string) => {
  return z.object({
    name: z.string().min(1, t("invalidName")),
  });
};

export const getPriceTypeSchema = (t: (value: string) => string) => {
  return z.object({
    name: z.string().min(1, t("invalidName")),
    currency: z.string().min(1, t("invalidCurrency")),
  });
};

export const getMemberSchema = (t: (value: string) => string) => {
  return z.object({
    roleId: z.string().min(1, t("invalidRoleId")),
  });
};

export const getInvitationSchema = (t: (value: string) => string) => {
  return z.object({
    email: z.string().email(t("invalidEmail")),
    roleId: z.string().min(1, t("invalidRoleId")),
  });
};

export const getRoleSchema = (t: (value: string) => string) => {
  return z.object({
    name: z.string().min(1, t("invalidName")),
    availableData: z.array(
      z.object({
        stockId: z.string().min(1, t("invalidStockId")),
        priceTypes: z.array(
          z.object({
            priceTypeId: z.string().min(1, t("invalidPriceTypeId")),
          })
        ),
      })
    ),
  });
};
