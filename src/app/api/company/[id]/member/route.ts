import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@prisma/client";
import db from "@/lib/db";
import getCurrentUser from "@/app/actions/get-current-user";
import getPaginationData from "@/lib/pagination";
import getLocale from "@/lib/get-locale";

type Props = {
  params: { id: string };
};

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
    const filters: Prisma.CompanyMembersWhereInput = {};
    filters.companyId = company.id;

    // Get members
    const [total, result] = await db.$transaction([
      db.companyMembers.count(),
      db.companyMembers.findMany({
        take: limit,
        skip: startIndex,
        where: filters,
        include: {
          user: true,
          companyRole: true,
        },
        orderBy: {
          userId: "desc",
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
