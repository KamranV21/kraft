import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import getCurrentUser from "@/app/actions/get-current-user";
import getAllowedCompany from "@/app/actions/get-allowed-company";
import db from "@/lib/db";
import { getPriceTypeSchema } from "@/lib/schemas";
import getPaginationData from "@/lib/pagination";
import getLocale from "@/lib/get-locale";

type Props = {
  params: { id: string };
};

export async function POST(request: NextRequest, { params: { id } }: Props) {
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

    // Create a new priceType
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

    const priceType = await db.priceType.create({
      data: {
        name,
        currency,
        company: {
          connect: {
            id: company.id,
          },
        },
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

export async function GET(request: NextRequest, { params: { id } }: Props) {
  const locale = getLocale(request.headers);
  const t = await getTranslations({ locale, namespace: "API" });

  try {
    const page = parseInt(
      request.nextUrl.searchParams.get("page") as string,
      10
    );
    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") as string,
      10
    );

    const startIndex = (page - 1) * limit;

    if (!page || !limit)
      return NextResponse.json(
        {
          errors: [{ message: t("pageAndlimitAreRequired") }],
        },
        { status: 400 }
      );

    // Find user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          errors: [{ message: t("notAuthorized") }],
        },
        { status: 401 }
      );
    }

    // Find company
    const company = await db.company.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            companyRole: {
              include: {
                availableData: true,
              },
            },
          },
        },
      },
    });
    if (!company) {
      return NextResponse.json(
        {
          errors: [{ message: t("invalidCompanyId") }],
        },
        { status: 404 }
      );
    }

    // Check that user is a member of a company
    const member = company.users.find((e) => e.userId == user.id);
    if (!member) {
      return NextResponse.json(
        {
          errors: [{ message: t("userIsNotAMember") }],
        },
        { status: 401 }
      );
    }

    // Filters
    const filters: Prisma.PriceTypeWhereInput = {};
    filters.companyId = company.id;
    if (!member.companyRole.default)
      filters.id = {
        in: member.companyRole.availableData.map((e) => e.priceTypeId),
      };

    // Get allowed priceTypes
    const [total, result] = await db.$transaction([
      db.priceType.count(),
      db.priceType.findMany({
        take: limit,
        skip: startIndex,
        where: filters,
        orderBy: {
          name: "desc",
        },
      }),
    ]);

    const pagination = getPaginationData(startIndex, page, limit, total);

    return NextResponse.json({
      result,
      pagination,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { errors: [{ message: t("serverError") }] },
      { status: 500 }
    );
  }
}
