package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "HTTP 请求总数，按 method / endpoint / status 分组",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP 请求耗时分布（秒）",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	httpRequestsInFlight = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "http_requests_in_flight",
			Help: "当前正在处理中的 HTTP 请求数",
		},
	)

	ordersTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "business_orders_total",
			Help: "创建的订单总数",
		},
	)

	orderAmount = promauto.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "business_order_amount",
			Help:    "订单金额分布",
			Buckets: []float64{10, 50, 100, 500, 1000, 5000},
		},
	)
)

type statusRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

func instrumentHandler(endpoint string, handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpRequestsInFlight.Inc()
		defer httpRequestsInFlight.Dec()

		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, statusCode: http.StatusOK}
		handler(rec, r)

		duration := time.Since(start).Seconds()
		httpRequestsTotal.WithLabelValues(
			r.Method, endpoint, fmt.Sprintf("%d", rec.statusCode),
		).Inc()
		httpRequestDuration.WithLabelValues(r.Method, endpoint).Observe(duration)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"ok"}`)
}

func handleHello(w http.ResponseWriter, r *http.Request) {
	time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"message":"hello, world!"}`)
}

func handleSlow(w http.ResponseWriter, r *http.Request) {
	time.Sleep(time.Duration(500+rand.Intn(2000)) * time.Millisecond)
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"message":"slow response"}`)
}

func handleError(w http.ResponseWriter, r *http.Request) {
	time.Sleep(time.Duration(rand.Intn(50)) * time.Millisecond)
	if rand.Float64() < 0.3 {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, `{"error":"internal server error"}`)
		return
	}
	if rand.Float64() < 0.2 {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"error":"bad request"}`)
		return
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"message":"ok"}`)
}

func handleOrder(w http.ResponseWriter, r *http.Request) {
	time.Sleep(time.Duration(100+rand.Intn(300)) * time.Millisecond)
	amount := rand.Float64() * 5000
	ordersTotal.Inc()
	orderAmount.Observe(amount)
	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"order_id":"%d","amount":%.2f}`, rand.Intn(100000), amount)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", instrumentHandler("/health", handleHealth))
	mux.HandleFunc("/api/hello", instrumentHandler("/api/hello", handleHello))
	mux.HandleFunc("/api/slow", instrumentHandler("/api/slow", handleSlow))
	mux.HandleFunc("/api/error", instrumentHandler("/api/error", handleError))
	mux.HandleFunc("/api/order", instrumentHandler("/api/order", handleOrder))
	mux.Handle("/metrics", promhttp.Handler())

	log.Printf("Server starting on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
