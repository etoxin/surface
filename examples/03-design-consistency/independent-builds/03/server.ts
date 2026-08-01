export const PORT = 8022;

const STYLESHEET_URL = new URL(
  "../../vendor/govuk-frontend-6.4.0/govuk-frontend.min.css",
  import.meta.url,
);

export function createApp(): (request: Request) => Promise<Response> {
  let stylesheet: Promise<string> | undefined;

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(PAGE, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "content-security-policy":
            "default-src 'self'; style-src 'self'; script-src 'unsafe-inline'; img-src 'self'; connect-src 'self'",
        },
      });
    }
    if (
      request.method === "GET" &&
      url.pathname === "/assets/govuk-frontend.min.css"
    ) {
      stylesheet ??= Deno.readTextFile(STYLESHEET_URL);
      return new Response(await stylesheet, {
        headers: {
          "content-type": "text/css; charset=utf-8",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  };
}

const PAGE = `<!doctype html>
<html lang="en" class="govuk-template">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Report a street problem – Northbridge Council</title>
    <link rel="stylesheet" href="/assets/govuk-frontend.min.css">
  </head>
  <body class="govuk-template__body">
    <a href="#main-content" class="govuk-skip-link">Skip to main content</a>
    <header class="govuk-header" data-module="govuk-header">
      <div class="govuk-header__container govuk-width-container">
        <div class="govuk-header__content">
          <a href="/" class="govuk-header__link govuk-header__service-name">Northbridge Council</a>
        </div>
      </div>
    </header>

    <div class="govuk-width-container">
      <main class="govuk-main-wrapper" id="main-content" tabindex="-1">
        <div class="govuk-grid-row">
          <div class="govuk-grid-column-two-thirds">
            <section id="form-view" aria-labelledby="form-title">
              <div class="govuk-error-summary" id="error-summary" data-module="govuk-error-summary" tabindex="-1" hidden>
                <div role="alert">
                  <h2 class="govuk-error-summary__title">There is a problem</h2>
                  <div class="govuk-error-summary__body">
                    <ul class="govuk-list govuk-error-summary__list" id="error-list"></ul>
                  </div>
                </div>
              </div>

              <h1 class="govuk-heading-xl" id="form-title" tabindex="-1">Report a street problem</h1>
              <form id="report-form" novalidate>
                <div class="govuk-form-group" id="problemType-group">
                  <fieldset class="govuk-fieldset" aria-describedby="problemType-error">
                    <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
                      <span class="govuk-fieldset__heading">What is the problem?</span>
                    </legend>
                    <p class="govuk-error-message" id="problemType-error" hidden>
                      <span class="govuk-visually-hidden">Error:</span> Select the type of street problem.
                    </p>
                    <div class="govuk-radios" data-module="govuk-radios">
                      <div class="govuk-radios__item">
                        <input class="govuk-radios__input" id="problemType-pothole" name="problemType" type="radio" value="pothole">
                        <label class="govuk-label govuk-radios__label" for="problemType-pothole">Pothole</label>
                      </div>
                      <div class="govuk-radios__item">
                        <input class="govuk-radios__input" id="problemType-brokenStreetlight" name="problemType" type="radio" value="brokenStreetlight">
                        <label class="govuk-label govuk-radios__label" for="problemType-brokenStreetlight">Broken streetlight</label>
                      </div>
                      <div class="govuk-radios__item">
                        <input class="govuk-radios__input" id="problemType-damagedRoadSign" name="problemType" type="radio" value="damagedRoadSign">
                        <label class="govuk-label govuk-radios__label" for="problemType-damagedRoadSign">Damaged road sign</label>
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div class="govuk-form-group" id="location-group">
                  <label class="govuk-label govuk-label--l" for="location">Where is the problem?</label>
                  <p class="govuk-error-message" id="location-error" hidden>
                    <span class="govuk-visually-hidden">Error:</span> Enter where the problem is.
                  </p>
                  <input class="govuk-input" id="location" name="location" type="text" autocomplete="street-address" aria-describedby="location-error">
                </div>

                <div class="govuk-form-group" id="details-group">
                  <label class="govuk-label govuk-label--l" for="details">Tell us more (optional)</label>
                  <textarea class="govuk-textarea" id="details" name="details" rows="5"></textarea>
                </div>

                <div class="govuk-form-group" id="reporterEmail-group">
                  <label class="govuk-label govuk-label--l" for="reporterEmail">Email address</label>
                  <p class="govuk-error-message" id="reporterEmail-error" hidden>
                    <span class="govuk-visually-hidden">Error:</span> Enter a valid email address.
                  </p>
                  <input class="govuk-input govuk-input--width-20" id="reporterEmail" name="reporterEmail" type="email" autocomplete="email" spellcheck="false" aria-describedby="reporterEmail-error">
                </div>

                <button class="govuk-button" data-module="govuk-button" type="submit">Continue</button>
              </form>
            </section>

            <section id="review-view" aria-labelledby="review-title" hidden>
              <a href="#" class="govuk-back-link" id="review-back">Back</a>
              <h1 class="govuk-heading-xl" id="review-title" tabindex="-1">Check your answers before sending your report</h1>
              <dl class="govuk-summary-list">
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">What is the problem?</dt>
                  <dd class="govuk-summary-list__value" id="review-problemType"></dd>
                  <dd class="govuk-summary-list__actions">
                    <a class="govuk-link change-link" href="#problemType-pothole" data-field="problemType">Change<span class="govuk-visually-hidden"> what is the problem?</span></a>
                  </dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Where is the problem?</dt>
                  <dd class="govuk-summary-list__value" id="review-location"></dd>
                  <dd class="govuk-summary-list__actions">
                    <a class="govuk-link change-link" href="#location" data-field="location">Change<span class="govuk-visually-hidden"> where is the problem?</span></a>
                  </dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Tell us more (optional)</dt>
                  <dd class="govuk-summary-list__value" id="review-details"></dd>
                  <dd class="govuk-summary-list__actions">
                    <a class="govuk-link change-link" href="#details" data-field="details">Change<span class="govuk-visually-hidden"> additional details</span></a>
                  </dd>
                </div>
                <div class="govuk-summary-list__row">
                  <dt class="govuk-summary-list__key">Email address</dt>
                  <dd class="govuk-summary-list__value" id="review-reporterEmail"></dd>
                  <dd class="govuk-summary-list__actions">
                    <a class="govuk-link change-link" href="#reporterEmail" data-field="reporterEmail">Change<span class="govuk-visually-hidden"> email address</span></a>
                  </dd>
                </div>
              </dl>
              <button class="govuk-button" data-module="govuk-button" id="send-report" type="button">Send report</button>
            </section>

            <section id="confirmation-view" aria-labelledby="confirmation-title" hidden>
              <div class="govuk-panel govuk-panel--confirmation">
                <h1 class="govuk-panel__title" id="confirmation-title" tabindex="-1">Report submitted</h1>
                <div class="govuk-panel__body">
                  Your reference number<br><strong>SR-2026-001</strong>
                </div>
              </div>
              <p class="govuk-body">We have sent a confirmation to the supplied email address.</p>
            </section>
          </div>
        </div>
      </main>
    </div>

    <footer class="govuk-footer">
      <div class="govuk-width-container">
        <div class="govuk-footer__meta">
          <div class="govuk-footer__meta-item govuk-footer__meta-item--grow">
            <span class="govuk-footer__licence-description">Northbridge Council</span>
          </div>
        </div>
      </div>
    </footer>

    <script>
      const title = "Report a street problem – Northbridge Council";
      const problemLabels = {
        pothole: "Pothole",
        brokenStreetlight: "Broken streetlight",
        damagedRoadSign: "Damaged road sign",
      };
      const report = {
        problemType: "",
        location: "",
        details: "",
        reporterEmail: "",
      };
      const byId = (id) => document.getElementById(id);

      function setView(name) {
        byId("form-view").hidden = name !== "form";
        byId("review-view").hidden = name !== "review";
        byId("confirmation-view").hidden = name !== "confirmation";
        document.title = title;
        window.scrollTo(0, 0);
      }

      function showForm(focusId) {
        setView("form");
        if (focusId) byId(focusId).focus();
        else byId("form-title").focus();
      }

      function clearErrors() {
        byId("error-summary").hidden = true;
        byId("error-list").replaceChildren();
        for (const field of ["problemType", "location", "reporterEmail"]) {
          byId(field + "-group").classList.remove("govuk-form-group--error");
          byId(field + "-error").hidden = true;
          if (field !== "problemType") {
            byId(field).classList.remove("govuk-input--error");
            byId(field).removeAttribute("aria-invalid");
          }
        }
      }

      function showErrors(errors) {
        clearErrors();
        const list = byId("error-list");
        for (const error of errors) {
          byId(error.field + "-group").classList.add("govuk-form-group--error");
          byId(error.field + "-error").hidden = false;
          if (error.field !== "problemType") {
            byId(error.field).classList.add("govuk-input--error");
            byId(error.field).setAttribute("aria-invalid", "true");
          }
          const item = document.createElement("li");
          const link = document.createElement("a");
          link.href = "#" + error.focusId;
          link.textContent = error.message;
          item.append(link);
          list.append(item);
        }
        byId("error-summary").hidden = false;
        document.title = "Error: " + title;
        byId("error-summary").focus();
      }

      function readAndNormalizeReport() {
        report.problemType = document.querySelector('input[name="problemType"]:checked')?.value || "";
        report.location = byId("location").value.trim();
        report.details = byId("details").value.trim();
        report.reporterEmail = byId("reporterEmail").value.trim().toLowerCase();
        byId("location").value = report.location;
        byId("details").value = report.details;
        byId("reporterEmail").value = report.reporterEmail;
      }

      function validateReport() {
        const errors = [];
        if (!report.problemType) {
          errors.push({
            field: "problemType",
            focusId: "problemType-pothole",
            message: "Select the type of street problem.",
          });
        }
        if (!report.location) {
          errors.push({
            field: "location",
            focusId: "location",
            message: "Enter where the problem is.",
          });
        }
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(report.reporterEmail)) {
          errors.push({
            field: "reporterEmail",
            focusId: "reporterEmail",
            message: "Enter a valid email address.",
          });
        }
        return errors;
      }

      function showReview() {
        clearErrors();
        byId("review-problemType").textContent = problemLabels[report.problemType];
        byId("review-location").textContent = report.location;
        byId("review-details").textContent = report.details || "Not provided";
        byId("review-reporterEmail").textContent = report.reporterEmail;
        setView("review");
        byId("review-title").focus();
      }

      byId("report-form").addEventListener("submit", (event) => {
        event.preventDefault();
        readAndNormalizeReport();
        const errors = validateReport();
        if (errors.length) showErrors(errors);
        else showReview();
      });

      byId("review-back").addEventListener("click", (event) => {
        event.preventDefault();
        showForm();
      });

      for (const link of document.querySelectorAll(".change-link")) {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          const field = event.currentTarget.dataset.field;
          showForm(field === "problemType" ? "problemType-pothole" : field);
        });
      }

      byId("send-report").addEventListener("click", () => {
        setView("confirmation");
        byId("confirmation-title").focus();
      });
    </script>
  </body>
</html>`;

if (import.meta.main) {
  console.log(`Report a street problem: http://localhost:${PORT}/`);
  Deno.serve({ port: PORT }, createApp());
}
