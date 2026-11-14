import { type CampusRecord, campusDisplay, campusNameWords } from "../data/05-two-campuses";
import styles from "./CampusHoverCard.module.css";

export function CampusHoverCard({ campus, id }: { campus: CampusRecord; id: string }) {
  const name = campus.campus
    .split(" ")
    .map(
      (word) =>
        campusNameWords[word] ??
        word.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .join(" ");
  return (
    <aside id={id} className={styles.tooltip} role="tooltip">
      <strong>{name}</strong>
      <div className={styles.metadata}>
        <span>{campusDisplay.schoolYear}</span>
        <dl>
          <div>
            <dt>{campusDisplay.grade}</dt>
            <dd>{campus.rating}</dd>
          </div>
          <div>
            <dt>{campusDisplay.score}</dt>
            <dd>{campus.score}</dd>
          </div>
        </dl>
      </div>
      <span className="tx-tag is-pending">{campusDisplay.finalRating}</span>
    </aside>
  );
}
