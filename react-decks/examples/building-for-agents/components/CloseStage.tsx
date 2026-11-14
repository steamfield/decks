import { OdQrCard, StoryCover } from "@steamfield/decks/kit";
import { BYLINE } from "../data/01-cover";
import { countWord } from "../data/03-thread";
import { INSTALL, PRODUCT_COUNT, SITE } from "../data/19-close";
import styles from "./CloseStage.module.css";
import { NightDriveField } from "./NightDriveField";
import { SfMark } from "./SfMark";

const month = new Date(`${BYLINE.month}-01`).toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const host = new URL(SITE).host;

export function CloseStage() {
  return (
    <StoryCover
      field={<NightDriveField low />}
      head={
        <div className="sf-cover-head od-enter-a">
          <span className="sf-wordmark">
            <SfMark className="sf-wordmark-mark" />
            steamfield
          </span>
          <span className="sf-cover-nav">
            <span>{BYLINE.event}</span>
            <span>{month}</span>
          </span>
        </div>
      }
      title={<span className="sf-chrome">{host}</span>}
      lede={
        <>
          <span className="sf-prompt">❯</span> {countWord(PRODUCT_COUNT)} products, most of them
          open source.
        </>
      }
      byline={
        <>
          <span className={`cl-install ${styles.install}`}>
            {INSTALL.map((command) => (
              <span key={command} className="cl-command">
                <span className="sf-prompt">$</span> {command}
              </span>
            ))}
          </span>
          <span className={`cl-qr ${styles.qr}`}>
            <OdQrCard url={SITE} ariaLabel={`QR code to ${host}`} />
            <span className="sf-cover-by">
              <span>{BYLINE.speaker}</span>
              <span className="is-alt">{BYLINE.studio}</span>
            </span>
          </span>
        </>
      }
    />
  );
}
