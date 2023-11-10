/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import prayTimes from "./PrayTimes.js";

function parseURL(url) {
    const args = new URL(url).searchParams;
    return {
        year: parseInt(args.get("year")),
        month: parseInt(args.get("month")),
        date: parseInt(args.get("date")),
        latitude: parseFloat(args.get("latitude")),
        longitude: parseFloat(args.get("longitude")),
    };
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

function processPos(latitude, longitude) {
    // default coordinates: Halifax, NS, Canada
    const defaultPos = { latitude: 44.65, longitude: -63.57 };
    return {
        latitude: isNaN(latitude) ? defaultPos.latitude : latitude,
        longitude: isNaN(longitude) ? defaultPos.longitude : longitude,
    };
}

function getPrayerTimes(params) {
    const date = processDate(params.year, params.month, params.date);
    const pos = processPos(params.latitude, params.longitude);
    prayTimes.setMethod("ISNA");
    const times = prayTimes.getTimes(
        [date.year, date.month, date.date],
        [pos.latitude, pos.longitude],
        "auto",
        "auto",
        "12h"
    );
    return {
        meta: {
            date: date,
            position: pos,
        },
        data: {
            fajr: times.fajr,
            zuhr: times.dhuhr,
            asr: times.asr,
            maghrib: times.maghrib,
            isha: times.isha,
        },
    };
}

export default {
    async fetch(request, env, ctx) {
        return request.method === "GET"
            ? new Response(
                  JSON.stringify(
                      getPrayerTimes(parseURL(request.url)),
                      undefined,
                      2
                  ),
                  {
                      status: 200,
                      headers: {
                          "Access-Control-Allow-Methods": "GET",
                          "Access-Control-Allow-Origin":
                              "https://prayers.cybar.dev",
                      },
                  }
              )
            : new Response("Invalid Request: only GET requests supported");
    },
};
