import TimerWidget from "../../components/TimerWidget";

export default function WidgetPage({ searchParams }) {
  const { taskId, userId, notionPageId } = searchParams;
  return <TimerWidget taskId={taskId} userId={userId} notionPageId={notionPageId} />;
}
