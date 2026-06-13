import { connectDB } from "@/lib/mongodb";
import { WebsitePdf } from "@/models/WebsitePdf";
import { sitePdfEmbedUrl } from "@/lib/pdfResponse";

export type PublicWebsitePdf = {
  _id: string;
  title: string;
  pdfFileName: string;
  pdfUrl: string;
};

export async function getPublicCoursePdfs(): Promise<PublicWebsitePdf[]> {
  const connection = await connectDB();
  if (connection.readyState !== 1) {
    return [];
  }

  const items = await WebsitePdf.find({ status: "active" })
    .select("title pdfFileName")
    .sort({ createdAt: -1 })
    .lean();

  return items.map((item) => ({
    _id: String(item._id),
    title: item.title,
    pdfFileName: item.pdfFileName || `${item.title}.pdf`,
    pdfUrl: sitePdfEmbedUrl(String(item._id)),
  }));
}
