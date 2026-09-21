// Slot eligibility: 'new' = new patients only, 'established' = established patients only, 'both' = either.
// Mirrors provider scheduling templates that restrict slots by patient type.
var AVAILABILITY = [
  {
    heading: 'Mon, Sep 21',
    slots: [
      { time: '11:30 AM', eligibility: 'new' },
      { time: '1:00 PM', eligibility: 'both' },
      { time: '1:15 PM', eligibility: 'established' },
      { time: '2:00 PM', eligibility: 'both' },
      { time: '2:15 PM', eligibility: 'new' },
      { time: '2:30 PM', eligibility: 'established' },
      { time: '2:45 PM', eligibility: 'both' },
      { time: '3:00 PM', eligibility: 'new' }
    ]
  },
  {
    heading: 'Tue, Sep 22',
    slots: [
      { time: '9:15 AM', eligibility: 'established' },
      { time: '10:30 AM', eligibility: 'both' },
      { time: '11:00 AM', eligibility: 'new' },
      { time: '11:15 AM', eligibility: 'both' },
      { time: '11:30 AM', eligibility: 'established' },
      { time: '11:45 AM', eligibility: 'new' },
      { time: '1:30 PM', eligibility: 'both' },
      { time: '2:00 PM', eligibility: 'established' },
      { time: '2:15 PM', eligibility: 'new' },
      { time: '2:45 PM', eligibility: 'both' },
      { time: '3:00 PM', eligibility: 'established' }
    ],
    more: 1
  },
  {
    heading: 'Wed, Sep 23',
    slots: [
      { time: '9:30 AM', eligibility: 'both' },
      { time: '10:45 AM', eligibility: 'new' },
      { time: '11:00 AM', eligibility: 'established' },
      { time: '11:15 AM', eligibility: 'both' },
      { time: '11:30 AM', eligibility: 'new' },
      { time: '11:45 AM', eligibility: 'established' },
      { time: '1:00 PM', eligibility: 'both' },
      { time: '1:30 PM', eligibility: 'new' },
      { time: '1:45 PM', eligibility: 'established' },
      { time: '2:00 PM', eligibility: 'both' },
      { time: '2:15 PM', eligibility: 'new' }
    ],
    more: 3
  },
  {
    heading: 'Thu, Sep 24',
    slots: [
      { time: '9:30 AM', eligibility: 'established' },
      { time: '9:45 AM', eligibility: 'both' },
      { time: '10:15 AM', eligibility: 'new' },
      { time: '10:30 AM', eligibility: 'established' },
      { time: '11:00 AM', eligibility: 'both' },
      { time: '11:30 AM', eligibility: 'new' },
      { time: '11:45 AM', eligibility: 'established' },
      { time: '1:00 PM', eligibility: 'both' },
      { time: '1:15 PM', eligibility: 'new' },
      { time: '1:30 PM', eligibility: 'established' },
      { time: '1:45 PM', eligibility: 'both' }
    ],
    more: 4
  },
  {
    heading: 'Fri, Sep 25',
    slots: [
      { time: '8:00 AM', eligibility: 'new' },
      { time: '8:15 AM', eligibility: 'both' },
      { time: '8:30 AM', eligibility: 'established' },
      { time: '8:45 AM', eligibility: 'new' },
      { time: '9:30 AM', eligibility: 'both' },
      { time: '10:00 AM', eligibility: 'established' },
      { time: '10:15 AM', eligibility: 'new' },
      { time: '10:30 AM', eligibility: 'both' },
      { time: '10:45 AM', eligibility: 'established' },
      { time: '11:00 AM', eligibility: 'new' },
      { time: '11:15 AM', eligibility: 'both' }
    ]
  },
  {
    heading: 'Sat, Sep 26 &ndash; Sun, Sep 27',
    slots: []
  }
];

var PATIENT_TYPE_KEY = 'ols.patientType';
var SELECTED_SLOT_KEY = 'ols.selectedSlot';
var CONFLICT_KEY = 'ols.conflict';

var Scheduler = {
  getPatientType: function () {
    return sessionStorage.getItem(PATIENT_TYPE_KEY) || 'new';
  },

  setPatientType: function (type) {
    sessionStorage.setItem(PATIENT_TYPE_KEY, type);
  },

  getSelectedSlot: function () {
    var raw = sessionStorage.getItem(SELECTED_SLOT_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setSelectedSlot: function (slot) {
    sessionStorage.setItem(SELECTED_SLOT_KEY, JSON.stringify(slot));
  },

  takeConflict: function () {
    var raw = sessionStorage.getItem(CONFLICT_KEY);
    sessionStorage.removeItem(CONFLICT_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setConflict: function (conflict) {
    sessionStorage.setItem(CONFLICT_KEY, JSON.stringify(conflict));
  },

  isEligible: function (eligibility, patientType) {
    return eligibility === 'both' || eligibility === patientType;
  }
};

function renderAvailability(container, patientType) {
  var html = '';

  AVAILABILITY.forEach(function (day) {
    var eligible = day.slots.filter(function (slot) {
      return Scheduler.isEligible(slot.eligibility, patientType);
    });

    html += '<div class="day-heading">' + day.heading + '</div>';

    if (!eligible.length) {
      html += '<div class="no-appts">No available appointments</div>';
      return;
    }

    html += '<div class="time-slots">';
    eligible.forEach(function (slot) {
      html +=
        '<a class="time-slot" href="confirm-details.html"' +
        ' data-time="' + slot.time + '"' +
        ' data-day="' + day.heading + '"' +
        ' data-eligibility="' + slot.eligibility + '">' +
        slot.time +
        '</a>';
    });
    if (day.more) {
      html += '<span class="time-slot more">' + day.more + ' more</span>';
    }
    html += '</div>';
  });

  container.innerHTML = html;

  container.querySelectorAll('.time-slot[data-time]').forEach(function (el) {
    el.addEventListener('click', function () {
      Scheduler.setSelectedSlot({
        time: el.dataset.time,
        day: el.dataset.day,
        eligibility: el.dataset.eligibility,
        selectedAs: patientType
      });
    });
  });
}

// Step 1 shows day-level open counts per provider. Counts scale off the shared
// template so they never advertise more than the patient can actually book.
function renderDayCounts(container, patientType, factor) {
  var html = '';

  AVAILABILITY.forEach(function (day) {
    var parts = day.heading.split(', ');
    var eligible = day.slots.filter(function (slot) {
      return Scheduler.isEligible(slot.eligibility, patientType);
    }).length;

    if (!day.slots.length) {
      day.heading.split(' &ndash; ').forEach(function (weekendDay) {
        var bits = weekendDay.split(', ');
        html +=
          '<div class="day-slot disabled">' +
          '<div class="day-name">' + bits[0] + '</div>' +
          '<div class="day-date">' + bits[1] + '</div>' +
          '<div class="day-open">No appts</div>' +
          '</div>';
      });
      return;
    }

    var count = Math.max(1, Math.round(eligible * factor));
    html +=
      '<a class="day-slot" href="select-time.html">' +
      '<div class="day-name">' + parts[0] + '</div>' +
      '<div class="day-date">' + parts[1] + '</div>' +
      '<div class="day-open">' + count + ' open</div>' +
      '</a>';
  });

  container.innerHTML = html;
}

function initSearchResults(options) {
  var toggle = document.querySelector(options.toggleSelector);
  if (!toggle) return;

  var grids = Array.prototype.slice.call(document.querySelectorAll('[data-day-counts]'));

  function paint(type) {
    toggle.querySelectorAll('.patient-type-option').forEach(function (btn) {
      var isActive = btn.dataset.patientType === type;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    grids.forEach(function (grid) {
      renderDayCounts(grid, type, parseFloat(grid.dataset.dayCounts) || 1);
    });
  }

  toggle.querySelectorAll('.patient-type-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      Scheduler.setPatientType(btn.dataset.patientType);
      paint(btn.dataset.patientType);
    });
  });

  paint(Scheduler.getPatientType());
}

function initPatientTypeSelector(options) {
  var toggle = document.querySelector(options.toggleSelector);
  var container = document.querySelector(options.slotsSelector);
  if (!toggle || !container) return;

  function paint(type) {
    toggle.querySelectorAll('.patient-type-option').forEach(function (btn) {
      var isActive = btn.dataset.patientType === type;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    renderAvailability(container, type);
  }

  toggle.querySelectorAll('.patient-type-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.dataset.patientType;
      Scheduler.setPatientType(type);
      paint(type);
    });
  });

  paint(Scheduler.getPatientType());
  renderConflictBanner(options.conflictSelector);
}

function renderConflictBanner(selector) {
  var host = document.querySelector(selector);
  if (!host) return;

  var conflict = Scheduler.takeConflict();
  if (!conflict) {
    host.innerHTML = '';
    return;
  }

  var title =
    conflict.reserved === 'new'
      ? 'This appointment time is reserved for new patients.'
      : 'This appointment time is reserved for established patients.';

  var body =
    conflict.reserved === 'new'
      ? 'We found an established patient record for you. Please select another available time.'
      : 'Please select another available time.';

  host.innerHTML =
    '<div class="conflict-banner" role="alert">' +
    '<div class="conflict-title">' + title + '</div>' +
    '<div class="conflict-body">' + body + '</div>' +
    '</div>';
}
