import ReviewPage from "./ReviewPage";

export default async function Page({ params }) {
  const { qrIdentifier } = await params;

  return <ReviewPage qrIdentifier={qrIdentifier} />;
}
