import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import getAllowedCompany from "@/app/actions/get-allowed-company";
import db from "@/lib/db";
import { getPriceTypeSchema } from "@/lib/schemas";
import getLocale from "@/lib/get-locale";

type Props = {
  params: { id: string; priceTypeId: string };
};

export async function DELETE(
  request: NextRequest,
  { params: { id, priceTypeId } }: Props
) {
  const locale = getLocale(request.headers);
  const t = await getTranslations({ locale, namespace: "API" });

  try {
    // Find company
    const company = await getAllowedCompany(id);
    if (!company) {
      return NextResponse.json(
        {
          errors: [{ message: t("invalidCompanyId") }],
        },
        { status: 404 }
      );
    }

    // Delete a price type
    await db.priceType.delete({
      where: {
        id: priceTypeId,
      },
    });

    return NextResponse.json({ message: t("priceTypeDeleted") });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { errors: [{ message: t("serverError") }] },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params: { id, priceTypeId } }: Props
) {
  const locale = getLocale(request.headers);
  const t = await getTranslations({ locale, namespace: "API" });

  try {
    // Find company
    const company = await getAllowedCompany(id);
    if (!company) {
      return NextResponse.json(
        {
          errors: [{ message: t("invalidCompanyId") }],
        },
        { status: 404 }
      );
    }

    // Update a price type
    const body = await request.json();

    const st = await getTranslations({
      locale,
      namespace: "Schemas.priceTypeSchema",
    });
    const test = getPriceTypeSchema(st).safeParse(body);
    if (!test.success) {
      return NextResponse.json(
        {
          message: t("invalidRequest"),
          errors: test.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, currency } = test.data;

    const priceType = await db.priceType.update({
      where: {
        id: priceTypeId,
      },
      data: {
        name,
        currency,
      },
    });

    return NextResponse.json(priceType);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { errors: [{ message: t("serverError") }] },
      { status: 500 }
    );
  }
}
