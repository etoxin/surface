const page = `<!doctype html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Report a street problem - Northbridge Council</title>
  <link rel="stylesheet" href="/assets/govuk-frontend.min.css">
</head>
<body class="govuk-template__body">
  <script>document.body.className += ' js-enabled';</script>
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
        <div class="govuk-grid-column-two-thirds" id="app"></div>
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
    (function () {
      var app = document.getElementById('app');
      var pageTitle = 'Report a street problem - Northbridge Council';
      var values = {
        problemType: '',
        location: '',
        details: '',
        reporterEmail: ''
      };

      var problemLabels = {
        pothole: 'Pothole',
        brokenStreetlight: 'Broken streetlight',
        damagedRoadSign: 'Damaged road sign'
      };

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function checked(value) {
        return values.problemType === value ? ' checked' : '';
      }

      function errorMessage(errors, field) {
        if (!errors[field]) return '';
        return '<p id="' + field + '-error" class="govuk-error-message"><span class="govuk-visually-hidden">Error:</span> ' + errors[field] + '</p>';
      }

      function describedBy(base, errors, field) {
        return base + (errors[field] ? ' ' + field + '-error' : '');
      }

      function renderForm(errors, focusField) {
        errors = errors || {};
        var errorKeys = ['problemType', 'location', 'reporterEmail'].filter(function (key) { return errors[key]; });
        document.title = errorKeys.length ? 'Error: ' + pageTitle : pageTitle;

        var errorSummary = '';
        if (errorKeys.length) {
          errorSummary = '<div class="govuk-error-summary" data-module="govuk-error-summary" tabindex="-1" id="error-summary">' +
            '<div role="alert"><h2 class="govuk-error-summary__title">There is a problem</h2>' +
            '<div class="govuk-error-summary__body"><ul class="govuk-list govuk-error-summary__list">' +
            errorKeys.map(function (key) {
              return '<li><a href="#' + key + '">' + errors[key] + '</a></li>';
            }).join('') +
            '</ul></div></div></div>';
        }

        app.innerHTML = errorSummary +
          '<h1 class="govuk-heading-xl">Report a street problem</h1>' +
          '<form id="report-form" novalidate>' +
            '<div class="govuk-form-group' + (errors.problemType ? ' govuk-form-group--error' : '') + '">' +
              '<fieldset class="govuk-fieldset" aria-describedby="' + describedBy('problemType-hint', errors, 'problemType') + '">' +
                '<legend class="govuk-fieldset__legend govuk-fieldset__legend--l"><h2 class="govuk-fieldset__heading">What is the problem?</h2></legend>' +
                '<div id="problemType-hint" class="govuk-hint">Select one option.</div>' +
                errorMessage(errors, 'problemType') +
                '<div class="govuk-radios" data-module="govuk-radios">' +
                  '<div class="govuk-radios__item"><input class="govuk-radios__input" id="problemType" name="problemType" type="radio" value="pothole"' + checked('pothole') + '><label class="govuk-label govuk-radios__label" for="problemType">Pothole</label></div>' +
                  '<div class="govuk-radios__item"><input class="govuk-radios__input" id="problemType-brokenStreetlight" name="problemType" type="radio" value="brokenStreetlight"' + checked('brokenStreetlight') + '><label class="govuk-label govuk-radios__label" for="problemType-brokenStreetlight">Broken streetlight</label></div>' +
                  '<div class="govuk-radios__item"><input class="govuk-radios__input" id="problemType-damagedRoadSign" name="problemType" type="radio" value="damagedRoadSign"' + checked('damagedRoadSign') + '><label class="govuk-label govuk-radios__label" for="problemType-damagedRoadSign">Damaged road sign</label></div>' +
                '</div>' +
              '</fieldset>' +
            '</div>' +
            '<div class="govuk-form-group' + (errors.location ? ' govuk-form-group--error' : '') + '">' +
              '<label class="govuk-label govuk-label--l" for="location">Where is the problem?</label>' +
              errorMessage(errors, 'location') +
              '<input class="govuk-input' + (errors.location ? ' govuk-input--error' : '') + '" id="location" name="location" type="text" value="' + escapeHtml(values.location) + '"' + (errors.location ? ' aria-describedby="location-error"' : '') + '>' +
            '</div>' +
            '<div class="govuk-form-group">' +
              '<label class="govuk-label govuk-label--l" for="details">Tell us more (optional)</label>' +
              '<textarea class="govuk-textarea" id="details" name="details" rows="5">' + escapeHtml(values.details) + '</textarea>' +
            '</div>' +
            '<div class="govuk-form-group' + (errors.reporterEmail ? ' govuk-form-group--error' : '') + '">' +
              '<label class="govuk-label govuk-label--l" for="reporterEmail">Email address</label>' +
              errorMessage(errors, 'reporterEmail') +
              '<input class="govuk-input govuk-input--width-20' + (errors.reporterEmail ? ' govuk-input--error' : '') + '" id="reporterEmail" name="reporterEmail" type="email" autocomplete="email" spellcheck="false" value="' + escapeHtml(values.reporterEmail) + '"' + (errors.reporterEmail ? ' aria-describedby="reporterEmail-error"' : '') + '>' +
            '</div>' +
            '<button class="govuk-button" data-module="govuk-button" type="submit">Continue</button>' +
          '</form>';

        document.getElementById('report-form').addEventListener('submit', onContinue);
        if (errorKeys.length) {
          document.getElementById('error-summary').focus();
        } else if (focusField) {
          var target = document.getElementById(focusField);
          if (target) target.focus();
        }
      }

      function readForm(form) {
        var data = new FormData(form);
        values.problemType = String(data.get('problemType') || '');
        values.location = String(data.get('location') || '');
        values.details = String(data.get('details') || '');
        values.reporterEmail = String(data.get('reporterEmail') || '');
      }

      function onContinue(event) {
        event.preventDefault();
        readForm(event.currentTarget);
        var normalized = {
          problemType: values.problemType,
          location: values.location.trim(),
          details: values.details.trim(),
          reporterEmail: values.reporterEmail.trim().toLowerCase()
        };
        var errors = {};
        if (!normalized.problemType) errors.problemType = 'Select the type of street problem.';
        if (!normalized.location) errors.location = 'Enter where the problem is.';
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalized.reporterEmail)) errors.reporterEmail = 'Enter a valid email address.';
        if (Object.keys(errors).length) {
          renderForm(errors);
          return;
        }
        values = normalized;
        renderReview();
      }

      function summaryRow(key, label, value) {
        return '<div class="govuk-summary-list__row">' +
          '<dt class="govuk-summary-list__key">' + label + '</dt>' +
          '<dd class="govuk-summary-list__value">' + escapeHtml(value) + '</dd>' +
          '<dd class="govuk-summary-list__actions"><a class="govuk-link" href="#' + key + '" data-change="' + key + '">Change<span class="govuk-visually-hidden"> ' + label.toLowerCase() + '</span></a></dd>' +
          '</div>';
      }

      function renderReview() {
        document.title = pageTitle;
        app.innerHTML =
          '<a href="#" class="govuk-back-link" id="back-to-form">Back</a>' +
          '<h1 class="govuk-heading-xl">Check your answers before sending your report</h1>' +
          '<dl class="govuk-summary-list">' +
            summaryRow('problemType', 'What is the problem?', problemLabels[values.problemType]) +
            summaryRow('location', 'Where is the problem?', values.location) +
            summaryRow('details', 'Tell us more (optional)', values.details || 'Not provided') +
            summaryRow('reporterEmail', 'Email address', values.reporterEmail) +
          '</dl>' +
          '<button class="govuk-button" data-module="govuk-button" id="send-report" type="button">Send report</button>';

        document.getElementById('back-to-form').addEventListener('click', function (event) {
          event.preventDefault();
          renderForm();
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-change]'), function (link) {
          link.addEventListener('click', function (event) {
            event.preventDefault();
            renderForm({}, link.getAttribute('data-change'));
          });
        });
        document.getElementById('send-report').addEventListener('click', renderConfirmation);
        document.getElementById('main-content').focus();
      }

      function renderConfirmation() {
        document.title = pageTitle;
        app.innerHTML =
          '<div class="govuk-panel govuk-panel--confirmation">' +
            '<h1 class="govuk-panel__title">Report submitted</h1>' +
            '<div class="govuk-panel__body">Your reference number<br><strong>SR-2026-001</strong></div>' +
          '</div>' +
          '<p class="govuk-body">We have sent a confirmation to the supplied email address.</p>';
        document.getElementById('main-content').focus();
      }

      renderForm();
    }());
  </script>
</body>
</html>`;

const stylesheetUrl = new URL(
  "../../vendor/govuk-frontend-6.4.0/govuk-frontend.min.css",
  import.meta.url,
);

export function createApp(): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(page, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/assets/govuk-frontend.min.css"
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
        return new Response("Stylesheet not found", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  };
}

if (import.meta.main) {
  Deno.serve({ port: 8021 }, createApp());
}
