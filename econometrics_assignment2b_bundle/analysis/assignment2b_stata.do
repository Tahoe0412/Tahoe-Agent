clear all
set more off

* Update this path if the data file is stored elsewhere.
local data_path "/Users/ztq0412/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_spfptz7s92kx22_1fb9/temp/drag/fredgraph.dta"

use "`data_path'", clear

* Build a quarterly time variable from the observation date string.
gen obs_date = date(observation_date, "YMD")
format obs_date %td
gen quarter_date = qofd(obs_date)
format quarter_date %tq
tsset quarter_date

* Generate inflation.
gen infl = (ln(cpiaucsl) - ln(L.cpiaucsl)) * 400

* Generate lags before restricting the sample so pre-1970 data can serve
* as initial values, exactly as required in the assignment.
forvalues i = 1/4 {
    gen infl_lag`i' = L`i'.infl
    gen unrate_lag`i' = L`i'.unrate
}

* Keep the assignment sample. Earlier data are still available to define lags.
keep if tin(1970q1, 2019q4)

* Part (a): plot inflation and unemployment.
tsline infl, title("Inflation, 1970Q1-2019Q4") ytitle("Annualized quarterly inflation") ///
    name(infl_plot, replace)
tsline unrate, title("Unemployment Rate, 1970Q1-2019Q4") ytitle("Unemployment rate") ///
    name(unrate_plot, replace)
graph combine infl_plot unrate_plot, col(1) ///
    title("Assignment 2B: Inflation and Unemployment")

* Part (b): AR(p), p = 0,...,4.
display "AR(p) results"
forvalues p = 0/4 {
    if `p' == 0 {
        quietly regress infl
    }
    else {
        local arlags
        forvalues i = 1/`p' {
            local arlags `arlags' infl_lag`i'
        }
        quietly regress infl `arlags'
    }
    estat ic
}

* Part (c): ADL(p,q), p,q = 0,...,4.
display "ADL(p,q) results"
forvalues p = 0/4 {
    forvalues q = 0/4 {
        local ylags
        local xlags unrate
        if `p' > 0 {
            forvalues i = 1/`p' {
                local ylags `ylags' infl_lag`i'
            }
        }
        if `q' > 0 {
            forvalues j = 1/`q' {
                local xlags `xlags' unrate_lag`j'
            }
        }
        quietly regress infl `ylags' `xlags'
        display "Model ADL(" `p' "," `q' ")"
        estat ic
    }
}

* Part (d): ADL(3,3) and Granger causality.
regress infl infl_lag1 infl_lag2 infl_lag3 unrate unrate_lag1 unrate_lag2 unrate_lag3
test unrate_lag1 unrate_lag2 unrate_lag3

* Optional joint test including contemporaneous unemployment.
test unrate unrate_lag1 unrate_lag2 unrate_lag3
