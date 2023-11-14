import prayTimes from "./PrayTimes.ts";

function parseURL(url) {
    const args = new URL(url).searchParams;
    return {
        latitude: parseFloat(args.get("latitude")),
        longitude: parseFloat(args.get("longitude")),
        year: parseInt(args.get("year")),
        month: parseInt(args.get("month")),
        date: parseInt(args.get("date")),
        tz_offset: parseInt(args.get("tz")),
        dst: parseInt(args.get("dst")),
    };
}

function processPos(latitude, longitude) {
    // default coordinates: Halifax, NS, Canada
    const defaultPos = { latitude: 44.65, longitude: -63.57 };
    return isNaN(latitude) || isNaN(longitude)
        ? defaultPos
        : { latitude: latitude, longitude: longitude };
}

function processDate(year, month, date) {
    // default date: today
    const today = new Date();
    return {
        year: isNaN(year) ? today.getFullYear() : year,
        month: isNaN(month) ? today.getMonth() + 1 : month,
        date: isNaN(date) ? today.getDate() : date,
    };
}

function processTime(tz_offset, dst) {
    // default time: Atlantic Standard Time (AST)
    const ast = { tz_offset: -4, dst: 0 };
    return {
        tz_offset:
            isNaN(tz_offset) || tz_offset < -12 || tz_offset > 12
                ? ast.tz_offset
                : tz_offset,
        dst: [0, 1].includes(dst) ? dst : ast.dst,
        timefmt: "12h",
    };
}

function getPrayerTimes(params) {
    const date = processDate(params.year, params.month, params.date);
    const pos = processPos(params.latitude, params.longitude);
    const timeinfo = processTime(params.tz_offset, params.dst);
    prayTimes.setMethod("ISNA");
    const times = prayTimes.getTimes(
        [date.year, date.month, date.date],
        [pos.latitude, pos.longitude],
        timeinfo.tz_offset,
        timeinfo.dst,
        timeinfo.timefmt
    );
    return {
        meta: {
            date: date,
            position: pos,
            timezone_offset: timeinfo.tz_offset,
            daylight_saving_time: timeinfo.dst,
        },
        data: {
            prayers: {
                fajr: times.fajr,
                zuhr: times.dhuhr,
                asr: times.asr,
                maghrib: times.maghrib,
                isha: times.isha,
            },
            extras: {
                imsak: times.imsak,
                sunrise: times.sunrise,
                sunset: times.sunset,
                midnight: times.midnight,
            },
        },
    };
}

export default {
    async fetch(req, env, ctx) {
        return req.method === "GET"
            ? new Response(
                  JSON.stringify(
                      getPrayerTimes(parseURL(req.url)),
                      undefined,
                      2
                  ),
                  {
                      status: 200,
                      headers: {
                          "content-type": "application/json;charset=UTF-8",
                          "Access-Control-Allow-Methods": "GET",
                          "Access-Control-Allow-Origin":
                              "https://prayers.cybar.dev",
                      },
                  }
              )
            : new Response("Invalid Request: only GET requests supported", {
                  status: 405,
                  headers: {
                      "Access-Control-Allow-Methods": "GET",
                      "Access-Control-Allow-Origin":
                          "https://prayers.cybar.dev",
                  },
              });
    },
};
