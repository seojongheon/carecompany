export function PublishStatus({ published }: { published: boolean }) {
  return <span className={published ? "status-pill status-public" : "status-pill status-private"}>{published ? "고객 공개 중" : "비공개"}</span>;
}

