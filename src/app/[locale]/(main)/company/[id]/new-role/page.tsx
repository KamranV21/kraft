import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type {
  Stock as StockType,
  PriceType as PriceTypeType,
} from "@prisma/client";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import EditRole from "@/app/[locale]/(main)/company/[id]/(info)/roles/_components/edit-role";
import { getStocksAndPriceTypes } from "@/app/actions/get-stocks-price-types";
import getAllowedCompany from "@/app/actions/get-allowed-company";

type Props = {
  params: { locale: string; id: string };
};

export const generateMetadata = async ({
  params: { locale, id },
}: Props): Promise<Metadata> => {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const company = await getAllowedCompany(id);
  if (!company)
    return {
      title: `${t("projectName")}`,
      description: "",
    };

  return {
    title: t("newRoleTitle", { companyName: company.name }),
    description: t("newRoleDescription"),
  };
};

const NewRole = async ({ params: { id } }: Props) => {
  const company = await getAllowedCompany(id);
  if (!company) return notFound();

  const result = await getStocksAndPriceTypes(id);
  const emptyStocks: StockType[] = [];
  const stocks = result ? result[0].result : emptyStocks;
  const emptyPriceTypes: PriceTypeType[] = [];
  const priceTypes = result ? result[1].result : emptyPriceTypes;

  const t = await getTranslations("Role");

  return (
    <MaxWidthWrapper className="my-8">
      <div className="space-y-2 mb-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {t("newRoleTitle", { companyName: company.name })}
        </h1>
        <p className="text-lg text-muted-foreground">{t("newRoleSubtitle")}</p>
      </div>
      <EditRole companyId={id} stocks={stocks} priceTypes={priceTypes} />
    </MaxWidthWrapper>
  );
};

export default NewRole;
