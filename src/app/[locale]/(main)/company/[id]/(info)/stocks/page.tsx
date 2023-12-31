import { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Stock as StockType } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import StockForm from "./_components/stock-form";
import DeleteStock from "./_components/delete-stock";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import Pagination from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import request from "@/lib/request";
import { PaginationType } from "@/types";

type Props = {
  params: { locale: string; id: string };
  searchParams: {
    page?: number;
  };
};

type PaginatedData = {
  result: StockType[];
  pagination: PaginationType;
};

export const generateMetadata = async ({
  params: { locale },
}: Props): Promise<Metadata> => {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("stocksTitle"),
    description: t("stocksDescription"),
  };
};

const getCompanyStocks = async (companyId: string, page: number) => {
  try {
    const cookieStore = cookies();
    const headersList = headers();
    const cookie = headersList.get("cookie");

    return await request<PaginatedData>(
      `/api/company/${companyId}/stock?page=${page}&limit=10`,
      {
        headers: {
          "Accept-Language": cookieStore.get("NEXT_LOCALE")?.value,
          Cookie: cookie,
        },
        next: { revalidate: 0 },
      }
    );
  } catch (error) {
    return undefined;
  }
};

const Stocks = async ({ params: { id }, searchParams: { page } }: Props) => {
  const data = await getCompanyStocks(id, page ?? 1);
  if (!data) return notFound();

  const { result, pagination } = data;

  const t = await getTranslations("Stock");

  return (
    <MaxWidthWrapper className="mb-8">
      <div className="flex flex-col space-y-4 md:space-x-4 md:flex-row md:justify-between md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>
        <StockForm companyId={id} />
      </div>
      <div className="mt-4">
        {result.length > 0 && (
          <div className="grid grid-flow-row auto-rows-max place-items-center grid-cols-1 gap-4 pt-4 md:place-items-start md:grid-cols-2">
            {result.map((stock) => (
              <Card key={stock.id} className="h-full w-full">
                <CardHeader>
                  <div className="flex flex-row justify-between">
                    <CardTitle>{stock.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("openMenu")}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="flex flex-col"
                      >
                        <StockForm companyId={id} stock={stock} />
                        <DeleteStock companyId={id} stockId={stock.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{`${t("id")}: ${stock.id}`}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        <Pagination href={`/${id}/stocks?page=`} pagination={pagination} />
        <div />
      </div>
    </MaxWidthWrapper>
  );
};

export default Stocks;
