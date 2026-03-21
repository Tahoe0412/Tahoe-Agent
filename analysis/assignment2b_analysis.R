library(foreign)

default_data_path <- "/Users/ztq0412/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_spfptz7s92kx22_1fb9/temp/drag/fredgraph.dta"
args <- commandArgs(trailingOnly = TRUE)
data_path <- if (length(args) >= 1) args[[1]] else default_data_path

plot_path <- "output/assignment2b_plot.png"
ar_csv_path <- "output/assignment2b_ar_results.csv"
adl_csv_path <- "output/assignment2b_adl_results.csv"

create_lag <- function(x, k) {
  c(rep(NA_real_, k), head(x, -k))
}

build_formula <- function(lhs, rhs_terms) {
  as.formula(paste(lhs, "~", paste(rhs_terms, collapse = " + ")))
}

df <- read.dta(data_path)
df$date <- as.Date(df$observation_date)
df <- df[order(df$date), ]
df$infl <- c(NA_real_, diff(log(df$cpiaucsl)) * 400)

for (lag in 1:4) {
  df[[paste0("infl_lag", lag)]] <- create_lag(df$infl, lag)
  df[[paste0("unrate_lag", lag)]] <- create_lag(df$unrate, lag)
}

sample_df <- subset(
  df,
  date >= as.Date("1970-01-01") & date <= as.Date("2019-10-01")
)

png(plot_path, width = 1400, height = 900, res = 160)
par(mfrow = c(2, 1), mar = c(3, 4, 3, 2) + 0.1)
plot(
  sample_df$date,
  sample_df$infl,
  type = "l",
  col = "#ba3b46",
  lwd = 2,
  xlab = "",
  ylab = "Annualized quarterly inflation",
  main = "Inflation, 1970Q1-2019Q4"
)
grid(col = "grey85")
plot(
  sample_df$date,
  sample_df$unrate,
  type = "l",
  col = "#1f5aa6",
  lwd = 2,
  xlab = "Quarter",
  ylab = "Unemployment rate",
  main = "Unemployment Rate, 1970Q1-2019Q4"
)
grid(col = "grey85")
dev.off()

ar_results <- data.frame()
for (p in 0:4) {
  rhs_terms <- if (p == 0) "1" else c("1", paste0("infl_lag", 1:p))
  fit <- lm(build_formula("infl", rhs_terms), data = sample_df, na.action = na.exclude)
  ar_results <- rbind(
    ar_results,
    data.frame(
      p = p,
      n = nobs(fit),
      k = length(coef(fit)),
      AIC = AIC(fit),
      BIC = BIC(fit),
      adj_R2 = summary(fit)$adj.r.squared
    )
  )
}

adl_results <- data.frame()
for (p in 0:4) {
  for (q in 0:4) {
    y_lags <- if (p == 0) character(0) else paste0("infl_lag", 1:p)
    x_lags <- c("unrate", if (q == 0) character(0) else paste0("unrate_lag", 1:q))
    fit <- lm(build_formula("infl", c(y_lags, x_lags)), data = sample_df, na.action = na.exclude)
    adl_results <- rbind(
      adl_results,
      data.frame(
        p = p,
        q = q,
        n = nobs(fit),
        k = length(coef(fit)),
        AIC = AIC(fit),
        BIC = BIC(fit),
        adj_R2 = summary(fit)$adj.r.squared
      )
    )
  }
}

fit_adl33 <- lm(
  infl ~ infl_lag1 + infl_lag2 + infl_lag3 + unrate + unrate_lag1 + unrate_lag2 + unrate_lag3,
  data = sample_df,
  na.action = na.exclude
)

fit_restricted_granger <- lm(
  infl ~ infl_lag1 + infl_lag2 + infl_lag3 + unrate,
  data = sample_df,
  na.action = na.exclude
)

fit_restricted_all_unrate <- lm(
  infl ~ infl_lag1 + infl_lag2 + infl_lag3,
  data = sample_df,
  na.action = na.exclude
)

granger_test <- anova(fit_restricted_granger, fit_adl33)
all_unrate_test <- anova(fit_restricted_all_unrate, fit_adl33)

write.csv(ar_results, ar_csv_path, row.names = FALSE)
write.csv(adl_results, adl_csv_path, row.names = FALSE)

cat("Sample size:", nrow(sample_df), "\n")
cat("Sample range:", format(min(sample_df$date)), "to", format(max(sample_df$date)), "\n")
cat("Plot saved to:", plot_path, "\n")
cat("AR table saved to:", ar_csv_path, "\n")
cat("ADL table saved to:", adl_csv_path, "\n\n")

cat("AR model comparison\n")
print(ar_results)
cat("\n")

cat("Best AR by BIC: p =", ar_results$p[which.min(ar_results$BIC)], "\n")
cat("Best AR by AIC: p =", ar_results$p[which.min(ar_results$AIC)], "\n\n")

cat("Top 10 ADL models by BIC\n")
print(head(adl_results[order(adl_results$BIC), ], 10))
cat("\n")

cat("Top 10 ADL models by AIC\n")
print(head(adl_results[order(adl_results$AIC), ], 10))
cat("\n")

cat(
  "Best ADL by BIC: p =",
  adl_results$p[which.min(adl_results$BIC)],
  ", q =",
  adl_results$q[which.min(adl_results$BIC)],
  "\n"
)
cat(
  "Best ADL by AIC: p =",
  adl_results$p[which.min(adl_results$AIC)],
  ", q =",
  adl_results$q[which.min(adl_results$AIC)],
  "\n\n"
)

cat("ADL(3,3) coefficient table\n")
print(coef(summary(fit_adl33)))
cat("\n")

cat("Granger causality test for lagged unemployment terms only\n")
print(granger_test)
cat("\n")

cat("Joint significance test for all unemployment terms\n")
print(all_unrate_test)
cat("\n")

cat("Ljung-Box test for ADL(3,3) residuals at lag 4\n")
print(Box.test(residuals(fit_adl33), lag = 4, type = "Ljung-Box"))
cat("\n")

cat("Ljung-Box test for ADL(3,3) residuals at lag 8\n")
print(Box.test(residuals(fit_adl33), lag = 8, type = "Ljung-Box"))
