const stylesheetUrl = new URL(
  "../../vendor/govuk-frontend-6.4.0/govuk-frontend.min.css",
  import.meta.url,
);

const page = `<!doctype html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#1d70b8">
  <title>Report a street problem - Northbridge Council</title>
  <link rel="stylesheet" href="/assets/govuk-frontend.min.css">
</head>
<body class="govuk-template__body">
  <script>document.body.className += ' js-enabled';</script>
  <a href="#main-content" class="govuk-skip-link">Skip to main content</a>
  <header class="govuk-header" data-module="govuk-header">
    <div class="govuk-header__container govuk-width-container">
      <div class="govuk-header__logo">
        <a href="/" class="govuk-header__link govuk-header__link--homepage">Northbridge Council</a>
      </div>
      <div class="govuk-header__content">
        <a href="/" class="govuk-header__link govuk-header__service-name">Report a street problem</a>
      </div>
    </div>
  </header>
  <div class="govuk-width-container">
    <main class="govuk-main-wrapper" id="main-content" tabindex="-1">
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds" id="app">
          <form id="report-form" novalidate>
            <h1 class="govuk-heading-xl">Report a street problem</h1>

            <div class="govuk-form-group" id="problemType-group">
              <fieldset class="govuk-fieldset">
                <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
                  <span class="govuk-fieldset__heading">What is the problem?</span>
                </legend>
                <div class="govuk-radios" data-module="govuk-radios">
                  <div class="govuk-radios__item">
                    <input class="govuk-radios__input" id="problemType" name="problemType" type="radio" value="pothole">
                    <label class="govuk-label govuk-radios__label" for="problemType">Pothole</label>
                  </div>
                  <div class="govuk-radios__item">
                    <input class="govuk-radios__input" id="problemType-2" name="problemType" type="radio" value="brokenStreetlight">
                    <label class="govuk-label govuk-radios__label" for="problemType-2">Broken streetlight</label>
                  </div>
                  <div class="govuk-radios__item">
                    <input class="govuk-radios__input" id="problemType-3" name="problemType" type="radio" value="damagedRoadSign">
                    <label class="govuk-label govuk-radios__label" for="problemType-3">Damaged road sign</label>
                  </div>
                </div>
              </fieldset>
            </div>

            <div class="govuk-form-group" id="location-group">
              <label class="govuk-label govuk-label--l" for="location">Where is the problem?</label>
              <input class="govuk-input" id="location" name="location" type="text" autocomplete="street-address">
            </div>

            <div class="govuk-form-group" id="details-group">
              <label class="govuk-label govuk-label--l" for="details">Tell us more (optional)</label>
              <textarea class="govuk-textarea" id="details" name="details" rows="5"></textarea>
            </div>

            <div class="govuk-form-group" id="reporterEmail-group">
              <label class="govuk-label govuk-label--l" for="reporterEmail">Email address</label>
              <input class="govuk-input govuk-input--width-20" id="reporterEmail" name="reporterEmail" type="email" autocomplete="email" spellcheck="false">
            </div>

            <button class="govuk-button" data-module="govuk-button" type="submit">Continue</button>
          </form>
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
    (() => {
      const app = document.getElementById('app');
      const defaultTitle = 'Report a street problem - Northbridge Council';
      const values = {
        problemType: '',
        location: '',
        details: '',
        reporterEmail: ''
      };

      const problemLabels = {
        pothole: 'Pothole',
        brokenStreetlight: 'Broken streetlight',
        damagedRoadSign: 'Damaged road sign'
      };

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
      }

      function selected(value) {
        return values.problemType === value ? ' checked' : '';
      }

      function errorFor(errors, field) {
        const error = errors.find((item) => item.field === field);
        if (!error) return '';
        return '<p id="' + field + '-error" class="govuk-error-message"><span class="govuk-visually-hidden">Error:</span> ' + escapeHtml(error.message) + '</p>';
      }

      function groupClass(errors, field) {
        return errors.some((item) => item.field === field)
          ? 'govuk-form-group govuk-form-group--error'
          : 'govuk-form-group';
      }

      function describedBy(errors, field) {
        return errors.some((item) => item.field === field)
          ? ' aria-describedby="' + field + '-error"'
          : '';
      }

      function readForm(form) {
        const data = new FormData(form);
        values.problemType = String(data.get('problemType') || '');
        values.location = String(data.get('location') || '');
        values.details = String(data.get('details') || '');
        values.reporterEmail = String(data.get('reporterEmail') || '');
      }

      function validate() {
        values.location = values.location.trim();
        values.details = values.details.trim();
        values.reporterEmail = values.reporterEmail.trim().toLowerCase();

        const errors = [];
        if (!values.problemType) {
          errors.push({ field: 'problemType', message: 'Select the type of street problem.' });
        }
        if (!values.location) {
          errors.push({ field: 'location', message: 'Enter where the problem is.' });
        }
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(values.reporterEmail)) {
          errors.push({ field: 'reporterEmail', message: 'Enter a valid email address.' });
        }
        return errors;
      }

      function errorSummary(errors) {
        if (!errors.length) return '';
        return '<div class="govuk-error-summary" data-module="govuk-error-summary" tabindex="-1" id="error-summary">' +
          '<div role="alert"><h2 class="govuk-error-summary__title">There is a problem</h2>' +
          '<div class="govuk-error-summary__body"><ul class="govuk-list govuk-error-summary__list">' +
          errors.map((error) => '<li><a href="#' + error.field + '">' + escapeHtml(error.message) + '</a></li>').join('') +
          '</ul></div></div></div>';
      }

      function renderForm(errors = []) {
        document.title = errors.length ? 'Error: ' + defaultTitle : defaultTitle;
        app.innerHTML = errorSummary(errors) +
          '<form id="report-form" novalidate>' +
            '<h1 class="govuk-heading-xl">Report a street problem</h1>' +
            '<div class="' + groupClass(errors, 'problemType') + '" id="problemType-group">' +
              '<fieldset class="govuk-fieldset"' + describedBy(errors, 'problemType') + '>' +
                '<legend class="govuk-fieldset__legend govuk-fieldset__legend--l"><span class="govuk-fieldset__heading">What is the problem?</span></legend>' +
                errorFor(errors, 'problemType') +
                '<div class="govuk-radios" data-module="govuk-radios">' +
                  '<div class="govuk-radios__item"><input class="govuk-radios__input" id="problemType" name="problemType" type="radio" value="pothole"' + selected('pothole') + '><label class="govuk-label govuk-radios__label" for="problemType">Pothole</label></div>' +
                  '<div class="govuk-radios__item"><input class="govuk-radios__input" id="problemType-2" name="problemType" type="radio" value="brokenStreetlight"' + selected('brokenStreetlight') + '><label class="govuk-label govuk-radios__label" for="problemType-2">Broken streetlight</label></div>' +
                  '<div class="govuk-radios__item"><input class="govuk-radios__input" id="problemType-3" name="problemType" type="radio" value="damagedRoadSign"' + selected('damagedRoadSign') + '><label class="govuk-label govuk-radios__label" for="problemType-3">Damaged road sign</label></div>' +
                '</div>' +
              '</fieldset>' +
            '</div>' +
            '<div class="' + groupClass(errors, 'location') + '" id="location-group">' +
              '<label class="govuk-label govuk-label--l" for="location">Where is the problem?</label>' +
              errorFor(errors, 'location') +
              '<input class="govuk-input' + (errors.some((item) => item.field === 'location') ? ' govuk-input--error' : '') + '" id="location" name="location" type="text" autocomplete="street-address" value="' + escapeHtml(values.location) + '"' + describedBy(errors, 'location') + '>' +
            '</div>' +
            '<div class="govuk-form-group" id="details-group">' +
              '<label class="govuk-label govuk-label--l" for="details">Tell us more (optional)</label>' +
              '<textarea class="govuk-textarea" id="details" name="details" rows="5">' + escapeHtml(values.details) + '</textarea>' +
            '</div>' +
            '<div class="' + groupClass(errors, 'reporterEmail') + '" id="reporterEmail-group">' +
              '<label class="govuk-label govuk-label--l" for="reporterEmail">Email address</label>' +
              errorFor(errors, 'reporterEmail') +
              '<input class="govuk-input govuk-input--width-20' + (errors.some((item) => item.field === 'reporterEmail') ? ' govuk-input--error' : '') + '" id="reporterEmail" name="reporterEmail" type="email" autocomplete="email" spellcheck="false" value="' + escapeHtml(values.reporterEmail) + '"' + describedBy(errors, 'reporterEmail') + '>' +
            '</div>' +
            '<button class="govuk-button" data-module="govuk-button" type="submit">Continue</button>' +
          '</form>';

        document.getElementById('report-form').addEventListener('submit', (event) => {
          event.preventDefault();
          readForm(event.currentTarget);
          const nextErrors = validate();
          if (nextErrors.length) {
            renderForm(nextErrors);
            document.getElementById('error-summary').focus();
          } else {
            renderReview();
            document.getElementById('main-content').focus();
          }
        });
      }

      function summaryRow(label, value, field) {
        return '<div class="govuk-summary-list__row">' +
          '<dt class="govuk-summary-list__key">' + escapeHtml(label) + '</dt>' +
          '<dd class="govuk-summary-list__value">' + escapeHtml(value) + '</dd>' +
          '<dd class="govuk-summary-list__actions"><a class="govuk-link change-link" href="#" data-field="' + field + '">Change<span class="govuk-visually-hidden"> ' + escapeHtml(label.toLowerCase()) + '</span></a></dd>' +
          '</div>';
      }

      function renderReview() {
        document.title = 'Check your answers before sending your report - Northbridge Council';
        app.innerHTML =
          '<a href="#" class="govuk-back-link" id="back-link">Back</a>' +
          '<h1 class="govuk-heading-xl">Check your answers before sending your report</h1>' +
          '<dl class="govuk-summary-list">' +
            summaryRow('What is the problem?', problemLabels[values.problemType], 'problemType') +
            summaryRow('Where is the problem?', values.location, 'location') +
            summaryRow('Tell us more (optional)', values.details || 'Not provided', 'details') +
            summaryRow('Email address', values.reporterEmail, 'reporterEmail') +
          '</dl>' +
          '<button class="govuk-button" data-module="govuk-button" type="button" id="send-report">Send report</button>';

        document.getElementById('back-link').addEventListener('click', (event) => {
          event.preventDefault();
          renderForm();
          document.getElementById('main-content').focus();
        });
        app.querySelectorAll('.change-link').forEach((link) => {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            const field = event.currentTarget.dataset.field;
            renderForm();
            document.getElementById(field).focus();
          });
        });
        document.getElementById('send-report').addEventListener('click', () => {
          renderConfirmation();
          document.getElementById('main-content').focus();
        });
      }

      function renderConfirmation() {
        document.title = 'Report submitted - Northbridge Council';
        app.innerHTML =
          '<div class="govuk-panel govuk-panel--confirmation">' +
            '<h1 class="govuk-panel__title">Report submitted</h1>' +
            '<div class="govuk-panel__body">Your reference number<br><strong>SR-2026-001</strong></div>' +
          '</div>' +
          '<p class="govuk-body">We have sent a confirmation to the supplied email address.</p>';
      }

      document.getElementById('report-form').addEventListener('submit', (event) => {
        event.preventDefault();
        readForm(event.currentTarget);
        const errors = validate();
        if (errors.length) {
          renderForm(errors);
          document.getElementById('error-summary').focus();
        } else {
          renderReview();
          document.getElementById('main-content').focus();
        }
      });
    })();
  </script>
</body>
</html>`;

export function createApp(): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const { pathname } = new URL(request.url);

    if (request.method === "GET" && pathname === "/") {
      return new Response(page, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (
      request.method === "GET" &&
      pathname === "/assets/govuk-frontend.min.css"
    ) {
      try {
        const stylesheet = await Deno.readFile(stylesheetUrl);
        return new Response(stylesheet, {
          headers: {
            "content-type": "text/css; charset=utf-8",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        return new Response("Stylesheet unavailable", { status: 500 });
      }
    }

    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  };
}

if (import.meta.main) {
  Deno.serve({ port: 8020 }, createApp());
}
