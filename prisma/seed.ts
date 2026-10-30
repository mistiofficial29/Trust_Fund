import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash } from "crypto";

const db = new PrismaClient();
const UPLOADS = path.join(process.cwd(), "uploads");

function sha(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

function miniPdf(title: string) {
  const body = `SAMPLE – DEMO DOCUMENT\n${title}\nNot a real certificate.`;
  return Buffer.from(
    `%PDF-1.1
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 80 >> stream
BT /F1 12 Tf 40 140 Td (${body.replace(/\n/g, ") Tj T* (")}) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%EOF`,
  );
}

function coverSvg(title: string, hue: number) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},45%,28%)"/>
        <stop offset="100%" stop-color="hsl(${hue + 20},40%,48%)"/>
      </linearGradient></defs>
      <rect width="1200" height="640" fill="url(#g)"/>
      <text x="60" y="340" fill="white" font-size="42" font-family="Georgia">${title}</text>
      <text x="60" y="390" fill="rgba(255,255,255,.8)" font-size="18" font-family="Arial">Demo campaign cover</text>
    </svg>`,
  );
}

function wallet(n: number) {
  return `0x${n.toString(16).padStart(40, "a")}`;
}

function tx(n: number) {
  return `0x${n.toString(16).padStart(64, "b")}`;
}

async function saveFile(name: string, buf: Buffer) {
  await writeFile(path.join(UPLOADS, name), buf);
  return name;
}

async function addDoc(opts: {
  ownerType: string;
  ownerId: string;
  type: string;
  title: string;
  status?: string;
  fileName?: string;
  buffer?: Buffer;
}) {
  const buf = opts.buffer ?? miniPdf(opts.title);
  const fileUrl = await saveFile(opts.fileName ?? `${opts.ownerId}-${opts.type}.pdf`.replace(/[^a-zA-Z0-9.-]/g, ""), buf);
  return db.document.create({
    data: {
      ownerType: opts.ownerType,
      ownerId: opts.ownerId,
      type: opts.type,
      fileUrl,
      sha256: sha(buf),
      mimeType: opts.buffer && opts.fileName?.endsWith(".svg") ? "image/svg+xml" : "application/pdf",
      originalName: opts.title,
      status: opts.status ?? "APPROVED",
    },
  });
}

async function main() {
  await mkdir(UPLOADS, { recursive: true });
  await db.fraudFlag.deleteMany();
  await db.expense.deleteMany();
  await db.donation.deleteMany();
  await db.campaignUpdate.deleteMany();
  await db.budgetItem.deleteMany();
  await db.document.deleteMany();
  await db.campaign.deleteMany();
  await db.auditLog.deleteMany();
  await db.ngoProfile.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await hash("DemoPass123!", 10);

  const admin = await db.user.create({
    data: {
      email: "admin@trustfund.demo",
      passwordHash,
      name: "TrustFund Admin",
      role: "ADMIN",
    },
  });

  const donorUser = await db.user.create({
    data: {
      email: "donor@trustfund.demo",
      passwordHash,
      name: "Ananya Mehta",
      role: "DONOR",
      walletAddress: wallet(101),
    },
  });

  const ngoUser = await db.user.create({
    data: {
      email: "ngo@trustfund.demo",
      passwordHash,
      name: "Kiran Deshpande",
      role: "NGO",
      walletAddress: wallet(201),
    },
  });

  const extraNgoUsers = await Promise.all(
    [
      ["ngo-shiksha@trustfund.demo", "Ritu Sharma"],
      ["ngo-arogya@trustfund.demo", "Vivek Nair"],
      ["ngo-harit@trustfund.demo", "Farhan Qureshi"],
    ].map(([email, name], i) =>
      db.user.create({
        data: { email, passwordHash, name, role: "NGO", walletAddress: wallet(210 + i) },
      }),
    ),
  );

  const jalsetu = await db.ngoProfile.create({
    data: {
      userId: ngoUser.id,
      legalName: "Jalsetu Relief Foundation",
      registrationType: "TRUST",
      registrationNumber: "TF-DEMO-MH-1001",
      yearEstablished: 2014,
      city: "Pune",
      state: "Maharashtra",
      website: "https://demo.jalsetu.example",
      contactPerson: "Kiran Deshpande",
      phone: "020-555-0101",
      email: "hello@jalsetu.demo",
      govtAffiliated: false,
      verificationStatus: "VERIFIED",
      walletAddress: wallet(201),
    },
  });

  const shiksha = await db.ngoProfile.create({
    data: {
      userId: extraNgoUsers[0].id,
      legalName: "Shiksha Deep Society",
      registrationType: "SOCIETY",
      registrationNumber: "TF-DEMO-RJ-2002",
      yearEstablished: 2009,
      city: "Jaipur",
      state: "Rajasthan",
      contactPerson: "Ritu Sharma",
      phone: "0141-555-0202",
      email: "hello@shikshadeep.demo",
      govtAffiliated: true,
      govtDepartment: "Demo State Education Department, Rajasthan",
      affiliationCertNo: "EMP-DEMO-EDU-8841",
      verificationStatus: "VERIFIED",
      walletAddress: wallet(211),
    },
  });

  const arogya = await db.ngoProfile.create({
    data: {
      userId: extraNgoUsers[1].id,
      legalName: "Arogya Seva Trust",
      registrationType: "TRUST",
      registrationNumber: "TF-DEMO-KA-3003",
      yearEstablished: 2011,
      city: "Bengaluru",
      state: "Karnataka",
      contactPerson: "Vivek Nair",
      phone: "080-555-0303",
      email: "hello@arogyaseva.demo",
      govtAffiliated: false,
      parentOrg: "Arogya Seva Federation",
      verificationStatus: "VERIFIED",
      walletAddress: wallet(212),
    },
  });

  const harit = await db.ngoProfile.create({
    data: {
      userId: extraNgoUsers[2].id,
      legalName: "Harit Dharti Mission",
      registrationType: "SOCIETY",
      registrationNumber: "TF-DEMO-MP-4004",
      yearEstablished: 2018,
      city: "Bhopal",
      state: "Madhya Pradesh",
      contactPerson: "Farhan Qureshi",
      phone: "0755-555-0404",
      email: "hello@haritdharti.demo",
      govtAffiliated: false,
      verificationStatus: "PENDING",
      walletAddress: wallet(213),
    },
  });

  const ngos = [
    { ngo: jalsetu, docs: ["REGISTRATION_CERTIFICATE", "PAN", "CERT_12A", "CERT_80G"] },
    { ngo: shiksha, docs: ["REGISTRATION_CERTIFICATE", "PAN", "CERT_12A", "CERT_80G", "GOVT_AFFILIATION"] },
    { ngo: arogya, docs: ["REGISTRATION_CERTIFICATE", "PAN", "CERT_12A", "CERT_80G", "FCRA"] },
    { ngo: harit, docs: ["REGISTRATION_CERTIFICATE", "PAN"] },
  ];

  for (const row of ngos) {
    for (const type of row.docs) {
      await addDoc({
        ownerType: "NGO",
        ownerId: row.ngo.id,
        type,
        title: `${row.ngo.legalName} ${type} (demo)`,
        status: row.ngo.verificationStatus === "VERIFIED" ? "APPROVED" : "PENDING",
      });
    }
  }

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
  const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000);

  async function campaign(data: {
    ngo: typeof jalsetu;
    title: string;
    summary: string;
    story: string;
    category: string;
    state: string;
    district: string;
    area: string;
    goalInr: number;
    raisedInr: number;
    status: string;
    start: Date;
    end: Date;
    beneficiaries: number;
    budget: { category: string; amountInr: number }[];
    hue: number;
    onchainId: string;
  }) {
    const cover = coverSvg(data.title, data.hue);
    const coverPath = await saveFile(`${data.onchainId}-cover.svg`, cover);
    const created = await db.campaign.create({
      data: {
        ngoId: data.ngo.id,
        title: data.title,
        summary: data.summary,
        story: data.story,
        category: data.category,
        state: data.state,
        district: data.district,
        area: data.area,
        goalInr: data.goalInr,
        raisedInr: data.raisedInr,
        status: data.status,
        startDate: data.start,
        endDate: data.end,
        beneficiaries: data.beneficiaries,
        onchainId: data.onchainId,
        coverPath,
        budgetItems: { create: data.budget },
      },
      include: { budgetItems: true },
    });
    await addDoc({
      ownerType: "CAMPAIGN",
      ownerId: created.id,
      type: "CAMPAIGN_SUPPORT",
      title: `Needs assessment – ${data.title}`,
    });
    return created;
  }

  const c1 = await campaign({
    ngo: jalsetu,
    title: "Flood Relief for Families in Sangli, Maharashtra",
    summary: "Food kits, medicines and clothes for families recovering from monsoon floods in Sangli.",
    story:
      "<p>Heavy rain flooded low-lying hamlets around Sangli. Families lost grain stores and cooking pots.</p><p>This campaign buys dry rations, basic medicines and a change of clothes. Every purchase is logged with a bill.</p>",
    category: "FLOOD_RELIEF",
    state: "Maharashtra",
    district: "Sangli",
    area: "Walwa block",
    goalInr: 100000,
    raisedInr: 72500,
    status: "ACTIVE",
    start: daysAgo(40),
    end: daysAhead(20),
    beneficiaries: 120,
    budget: [
      { category: "Food", amountInr: 40000 },
      { category: "Medicines", amountInr: 25000 },
      { category: "Clothes", amountInr: 20000 },
      { category: "Logistics", amountInr: 15000 },
    ],
    hue: 174,
    onchainId: "camp-sangli-flood",
  });

  const c2 = await campaign({
    ngo: shiksha,
    title: "Books & Digital Classrooms for 5 Rural Schools",
    summary: "Library kits and a shared projector for five government schools in rural Jaipur district.",
    story:
      "<p>Children share torn textbooks across grades. Teachers asked for a small library and one projector they can rotate.</p>",
    category: "EDUCATION",
    state: "Rajasthan",
    district: "Jaipur",
    area: "Chomu",
    goalInr: 250000,
    raisedInr: 180000,
    status: "ACTIVE",
    start: daysAgo(50),
    end: daysAhead(35),
    beneficiaries: 420,
    budget: [
      { category: "Books", amountInr: 90000 },
      { category: "Digital kits", amountInr: 110000 },
      { category: "Logistics", amountInr: 50000 },
    ],
    hue: 28,
    onchainId: "camp-jaipur-schools",
  });

  const c3 = await campaign({
    ngo: arogya,
    title: "Free Health Camp & Medicines for Tribal Hamlets",
    summary: "A two-day health camp with medicines for hamlets on the Karnataka–Tamil Nadu border.",
    story: "<p>The camp has already been held. Remaining funds cover follow-up medicines listed on the bills below.</p>",
    category: "HEALTHCARE",
    state: "Karnataka",
    district: "Chamarajanagar",
    area: "BR Hills foothills",
    goalInr: 150000,
    raisedInr: 150000,
    status: "COMPLETED",
    start: daysAgo(70),
    end: daysAgo(5),
    beneficiaries: 310,
    budget: [
      { category: "Medicines", amountInr: 80000 },
      { category: "Camp logistics", amountInr: 45000 },
      { category: "Diagnostics", amountInr: 25000 },
    ],
    hue: 152,
    onchainId: "camp-health-hamlets",
  });

  const c4 = await campaign({
    ngo: jalsetu,
    title: "Clean Drinking Water Tanks for 3 Villages",
    summary: "Three 5,000-litre tanks and plumbing fittings for villages that lost wells in the last flood.",
    story: "<p>Hand-pumps silted up after the floods. Temporary tanks keep drinking water closer to homes.</p>",
    category: "FLOOD_RELIEF",
    state: "Maharashtra",
    district: "Kolhapur",
    area: "Hatkanangle",
    goalInr: 300000,
    raisedInr: 95000,
    status: "ACTIVE",
    start: daysAgo(25),
    end: daysAhead(50),
    beneficiaries: 90,
    budget: [
      { category: "Tanks", amountInr: 180000 },
      { category: "Plumbing", amountInr: 80000 },
      { category: "Logistics", amountInr: 40000 },
    ],
    hue: 200,
    onchainId: "camp-water-tanks",
  });

  const c5 = await campaign({
    ngo: shiksha,
    title: "Mid-Day Meal Support for 200 Children",
    summary: "Pulses, oil and vegetables to keep a mid-day meal running for 200 children for three months.",
    story: "<p>School cooks asked for a predictable grocery budget through the exam term.</p>",
    category: "FOOD_NUTRITION",
    state: "Rajasthan",
    district: "Jaipur",
    area: "Shahpura",
    goalInr: 80000,
    raisedInr: 30000,
    status: "ACTIVE",
    start: daysAgo(18),
    end: daysAhead(40),
    beneficiaries: 200,
    budget: [
      { category: "Food", amountInr: 60000 },
      { category: "Logistics", amountInr: 20000 },
    ],
    hue: 38,
    onchainId: "camp-midday-meals",
  });

  const c6 = await campaign({
    ngo: arogya,
    title: "Tree Plantation & Lake Cleanup Drive",
    summary: "Native saplings and a weekend cleanup around a peri-urban lake.",
    story: "<p>Just getting started. Volunteers and saplings will be listed as bills come in.</p>",
    category: "ENVIRONMENT",
    state: "Karnataka",
    district: "Bengaluru Urban",
    area: "Hessarghatta",
    goalInr: 60000,
    raisedInr: 12000,
    status: "ACTIVE",
    start: daysAgo(6),
    end: daysAhead(60),
    beneficiaries: 400,
    budget: [
      { category: "Saplings", amountInr: 35000 },
      { category: "Cleanup kit", amountInr: 15000 },
      { category: "Logistics", amountInr: 10000 },
    ],
    hue: 142,
    onchainId: "camp-lake-cleanup",
  });

  const donorNames = [
    "Ananya Mehta",
    "Rohan Iyer",
    "Meera Joshi",
    "Kabir Singh",
    "Diya Patel",
    "Arjun Reddy",
    "Sana Khan",
    "Nikhil Rao",
    "Priya Nair",
    "Aman Gupta",
    "Ishita Bose",
    "Rahul Verma",
    "Neha Kulkarni",
    "Vikram Shah",
    "Pooja Jain",
    "Aditya Menon",
    "Kavya Pillai",
    "Siddharth Das",
    "Tanvi Kapoor",
    "Harsh Vardhan",
    "Ritika Ghosh",
    "Manish Tiwari",
    "Shruti Desai",
    "Yash Agarwal",
    "Leela Krishnan",
  ];

  const donationPlan: { campaignId: string; amounts: number[] }[] = [
    { campaignId: c1.id, amounts: [2500, 1000, 500, 5000, 1000, 2000, 500, 10000, 500, 2500, 1000, 500, 5000, 2500, 2500] },
    { campaignId: c2.id, amounts: [5000, 2500, 10000, 1000, 2000, 500, 2500, 5000, 1000, 15000, 2500, 10000, 500, 2000, 5000, 10000, 5000, 2500, 1000, 2000] },
    { campaignId: c3.id, amounts: [10000, 5000, 2500, 10000, 5000, 2500, 15000, 1000, 5000, 2000, 10000, 5000, 25000, 2500, 5000, 10000, 5000, 2000, 15000, 10000, 5000] },
    { campaignId: c4.id, amounts: [5000, 2500, 10000, 1000, 500, 5000, 2000, 25000, 2500, 10000, 5000, 2500, 5000, 10000, 11000] },
    { campaignId: c5.id, amounts: [1000, 500, 2500, 5000, 2000, 1000, 5000, 2500, 500, 10000] },
    { campaignId: c6.id, amounts: [500, 1000, 2500, 2000, 500, 5500] },
  ];

  let dIndex = 0;
  for (const plan of donationPlan) {
    let raised = 0;
    for (const amount of plan.amounts) {
      const name = donorNames[dIndex % donorNames.length];
      const anonymous = dIndex % 7 === 0;
      await db.donation.create({
        data: {
          campaignId: plan.campaignId,
          donorId: dIndex === 1 ? donorUser.id : null,
          anonymous,
          donorName: anonymous ? null : name,
          amountInr: amount,
          amountWei: BigInt(Math.round((amount / 250000) * 1e18)).toString(),
          txHash: tx(1000 + dIndex),
          blockNumber: 100 + dIndex,
          message: dIndex % 5 === 0 ? "Hope this helps." : null,
          wallet: wallet(300 + dIndex),
          createdAt: daysAgo(60 - (dIndex % 60)),
        },
      });
      raised += amount;
      dIndex += 1;
    }
    await db.campaign.update({ where: { id: plan.campaignId }, data: { raisedInr: raised } });
  }

  async function expense(opts: {
    campaign: typeof c1;
    category: string;
    vendor: string;
    amountInr: number;
    description: string;
    billDate: Date;
    invoiceNo?: string;
    billBuf?: Buffer;
    fileName?: string;
  }) {
    const item = opts.campaign.budgetItems.find((b) => b.category === opts.category);
    if (!item) throw new Error(`Missing budget ${opts.category}`);
    const buf = opts.billBuf ?? miniPdf(`${opts.vendor} ${opts.amountInr}`);
    const doc = await addDoc({
      ownerType: "EXPENSE",
      ownerId: opts.campaign.id,
      type: "BILL",
      title: `Bill – ${opts.vendor}`,
      buffer: buf,
      fileName: opts.fileName,
    });
    return db.expense.create({
      data: {
        campaignId: opts.campaign.id,
        budgetItemId: item.id,
        vendor: opts.vendor,
        invoiceNo: opts.invoiceNo,
        amountInr: opts.amountInr,
        description: opts.description,
        quantity: "1 lot",
        billDate: opts.billDate,
        billDocId: doc.id,
        txHash: tx(8000 + Math.floor(Math.random() * 1000)),
        billHash: doc.sha256,
      },
    });
  }

  await expense({
    campaign: c1,
    category: "Food",
    vendor: "Sai Kirana & General Stores",
    amountInr: 20000,
    description: "Dry ration kits: rice, dal, oil",
    billDate: daysAgo(20),
    invoiceNo: "SK-441",
  });
  await expense({
    campaign: c1,
    category: "Medicines",
    vendor: "Mahalaxmi Medical Agency",
    amountInr: 15000,
    description: "ORS, paracetamol, antiseptic",
    billDate: daysAgo(18),
    invoiceNo: "MM-902",
  });
  await expense({
    campaign: c1,
    category: "Clothes",
    vendor: "Narmada Cloth House",
    amountInr: 9500,
    description: "Adult and child clothing packs",
    billDate: daysAgo(16),
    invoiceNo: "NC-118",
  });

  await expense({
    campaign: c2,
    category: "Books",
    vendor: "Deepak Book Depot",
    amountInr: 12000,
    description: "Grade 1–5 workbooks",
    billDate: daysAgo(22),
    invoiceNo: "DB-11",
  });
  await expense({
    campaign: c2,
    category: "Books",
    vendor: "Deepak Book Depot",
    amountInr: 8000,
    description: "Story books for libraries",
    billDate: daysAgo(14),
    invoiceNo: "DB-19",
  });
  const unusual = await expense({
    campaign: c2,
    category: "Digital kits",
    vendor: "PixelHive AV Demo Pvt Ltd",
    amountInr: 98000,
    description: "Five classroom projector kits",
    billDate: daysAgo(8),
    invoiceNo: "PH-77",
  });

  await expense({
    campaign: c3,
    category: "Medicines",
    vendor: "Arogya Pharma Distributors",
    amountInr: 40000,
    description: "Camp medicine stock",
    billDate: daysAgo(30),
    invoiceNo: "AP-4",
  });
  await expense({
    campaign: c3,
    category: "Camp logistics",
    vendor: "Nilgiri Tent House",
    amountInr: 18000,
    description: "Tents and seating",
    billDate: daysAgo(32),
    invoiceNo: "NT-8",
  });
  await expense({
    campaign: c3,
    category: "Diagnostics",
    vendor: "Sushrut Lab Supplies",
    amountInr: 12000,
    description: "Glucometer strips and BP cuffs",
    billDate: daysAgo(31),
    invoiceNo: "SL-2",
  });

  const dupBuf = miniPdf("Duplicate tank invoice DEMO");
  const eDup1 = await expense({
    campaign: c4,
    category: "Plumbing",
    vendor: "Koyna Hardware",
    amountInr: 14000,
    description: "Pipes and fittings",
    billDate: daysAgo(10),
    invoiceNo: "KH-55",
    billBuf: dupBuf,
    fileName: "dup-bill-a.pdf",
  });
  const eDup2 = await expense({
    campaign: c4,
    category: "Plumbing",
    vendor: "Koyna Hardware",
    amountInr: 14000,
    description: "Repeat upload of the same fittings bill",
    billDate: daysAgo(9),
    invoiceNo: "KH-55",
    billBuf: dupBuf,
    fileName: "dup-bill-b.pdf",
  });

  await expense({
    campaign: c5,
    category: "Food",
    vendor: "Sai Kirana & General Stores",
    amountInr: 9000,
    description: "Pulses and oil for mid-day meals",
    billDate: daysAgo(7),
    invoiceNo: "SK-512",
  });
  await expense({
    campaign: c6,
    category: "Saplings",
    vendor: "Green Canopy Nursery",
    amountInr: 4000,
    description: "Native saplings (first batch)",
    billDate: daysAgo(3),
    invoiceNo: "GC-1",
  });

  await db.fraudFlag.createMany({
    data: [
      {
        expenseId: eDup2.id,
        ruleId: "DUPLICATE_BILL",
        severity: "HIGH",
        reason: "This bill file matches another upload already on record.",
        status: "UNDER_REVIEW",
      },
      {
        expenseId: unusual.id,
        ruleId: "UNUSUAL_AMOUNT",
        severity: "MEDIUM",
        reason: "This amount is far from the usual range for Digital kits.",
        status: "UNDER_REVIEW",
      },
    ],
  });

  await db.campaignUpdate.createMany({
    data: [
      {
        campaignId: c1.id,
        title: "First kits reached Walwa",
        body: "Volunteers distributed 80 ration kits. Bills for food and medicines are on the expenses tab.",
      },
      {
        campaignId: c2.id,
        title: "Libraries packed",
        body: "Book bundles for three schools are packed. Projector purchase is under review.",
      },
    ],
  });

  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED",
      entityType: "SYSTEM",
      entityId: "demo",
      meta: "Demo data loaded",
    },
  });

  console.log("Seeded TrustFund demo data");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
