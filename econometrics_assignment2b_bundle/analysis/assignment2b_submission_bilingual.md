# Assignment 2B: ADL Model and Information Criteria

## English Version

### Data and Setup

This assignment uses quarterly U.S. macroeconomic data from `fredgraph.dta`. The empirical results reported below were reproduced in StataSE. Following the instructions, I construct the inflation rate as

\[
infl_t = \left(\ln(cpiaucsl_t) - \ln(cpiaucsl_{t-1})\right) \times 400
\]

and use the sample period from 1970:Q1 to 2019:Q4. Data before 1970 are used only to generate lagged variables when needed. The explanatory variable is the unemployment rate, `unrate`.

### (a) Plot of Inflation and Unemployment

The plot shows two clear patterns. First, inflation was high and volatile during the 1970s and early 1980s, then declined substantially and became more stable after the mid-1980s. Second, the unemployment rate displays cyclical movements, with major peaks in the early 1980s and again around the Great Recession.

The figure does not suggest a stable contemporaneous negative relationship between inflation and unemployment over the whole sample. Instead, the relationship appears to be dynamic and time-varying. This is consistent with the idea that unemployment may help predict inflation through lagged effects rather than through a simple contemporaneous Phillips-curve relationship.

### (b) AR(p) Model Selection for Inflation

I estimated AR(p) models for \(p = 0, 1, 2, 3, 4\). The information criteria are summarized below:

| p | AIC | BIC |
|---|---:|---:|
| 0 | 1028.16 | 1031.46 |
| 1 | 863.35 | 869.95 |
| 2 | 860.17 | 870.07 |
| 3 | 842.13 | 855.32 |
| 4 | 843.94 | 860.43 |

Both AIC and BIC choose the AR(3) model because it has the smallest value under both criteria.

### (c) ADL(p, q) Model Selection

Next, I estimated ADL(p, q) models for \(p, q = 0, 1, 2, 3, 4\), where inflation lags and current and lagged unemployment are included as regressors.

The best model selected by BIC is ADL(3,1), with `BIC = 857.64`. The best model selected by AIC is ADL(3,3), with `AIC = 832.97`.

Therefore, the results are consistent with the statement that AIC tends to select a more complex model than BIC. This happens because BIC imposes a heavier penalty for additional parameters, especially when the sample size is moderately large. In this sample, \(n = 200\), so BIC is more conservative than AIC.

### (d) Granger Causality in the ADL(3,3) Model

To test whether unemployment Granger-causes inflation, I estimated the ADL(3,3) model:

\[
infl_t = \beta_0 + \beta_1 infl_{t-1} + \beta_2 infl_{t-2} + \beta_3 infl_{t-3}
+ \gamma_0 unrate_t + \gamma_1 unrate_{t-1} + \gamma_2 unrate_{t-2} + \gamma_3 unrate_{t-3} + u_t
\]

The null hypothesis for Granger causality is

\[
H_0: \gamma_1 = \gamma_2 = \gamma_3 = 0
\]

The joint F-test gives:

- \(F(3,192) = 5.0158\)
- \(p = 0.002272\)

Since the p-value is well below 0.05, I reject the null hypothesis. Therefore, the unemployment rate does Granger-cause the inflation rate in the ADL(3,3) model.

Looking at the individual coefficients, `unrate_lag2` and `unrate_lag3` are statistically significant, while the contemporaneous unemployment rate and the first lag are not. This suggests that unemployment affects inflation mainly through delayed dynamics rather than through an immediate effect.

### Conclusion

In summary, the inflation series shows strong persistence, and AR(3) is preferred among the AR models. When unemployment is added, BIC selects ADL(3,1) while AIC selects the more flexible ADL(3,3), which supports the usual claim that AIC favors more complex specifications. Finally, the Granger-causality test indicates that lagged unemployment contains useful predictive information for inflation.

## 中文版本

### 数据与设定

本题使用 `fredgraph.dta` 中的美国季度宏观数据，下文报告的实证结果已经用 StataSE 复现并核对。按照题目要求，我将通胀率定义为

\[
infl_t = \left(\ln(cpiaucsl_t) - \ln(cpiaucsl_{t-1})\right) \times 400
\]

并将样本区间设为 `1970:Q1` 到 `2019:Q4`。`1970` 年之前的数据只用于在回归中生成滞后项。解释变量为失业率 `unrate`。

### （a）通胀率与失业率的图形分析

图形显示出两个比较明显的特征。第一，通胀率在 `1970` 年代和 `1980` 年代初明显较高，波动也更剧烈；而在 `1980` 年代中后期以后，通胀中枢明显下降，波动幅度也减弱。第二，失业率呈现出明显的周期性波动，并在 `1980` 年代初和全球金融危机前后出现高点。

从整段样本来看，通胀与失业率并没有表现出一个稳定的、同期的负相关关系。因此，更合理的理解是，失业率对通胀的影响可能主要通过滞后效应体现出来，而不是简单地表现为一个静态的 Phillips curve。

### （b）通胀率的 AR(p) 模型选择

我分别估计了 \(p = 0, 1, 2, 3, 4\) 的 AR(p) 模型，结果如下：

| p | AIC | BIC |
|---|---:|---:|
| 0 | 1028.16 | 1031.46 |
| 1 | 863.35 | 869.95 |
| 2 | 860.17 | 870.07 |
| 3 | 842.13 | 855.32 |
| 4 | 843.94 | 860.43 |

AIC 和 BIC 都选择 `AR(3)`，因为在所有候选模型中，`AR(3)` 的 AIC 和 BIC 都是最小的。

### （c）ADL(p, q) 模型选择

接下来，我估计了 \(p, q = 0, 1, 2, 3, 4\) 的 ADL(p, q) 模型，其中解释变量包括通胀自身的滞后项以及失业率的当期值和滞后值。

BIC 选择的最优模型是 `ADL(3,1)`，其 `BIC = 857.64`；AIC 选择的最优模型是 `ADL(3,3)`，其 `AIC = 832.97`。

这个结果与“AIC 往往比 BIC 选择更复杂模型”的说法是一致的。原因在于，BIC 对额外参数的惩罚更重，尤其当样本量较大时这种差异更明显。本题样本量为 `n = 200`，因此 BIC 更倾向于选择更精简的模型，而 AIC 更愿意保留更多滞后项。

### （d）ADL(3,3) 模型中的 Granger 因果关系检验

为了检验失业率是否 Granger 导致通胀率，我估计了如下 `ADL(3,3)` 模型：

\[
infl_t = \beta_0 + \beta_1 infl_{t-1} + \beta_2 infl_{t-2} + \beta_3 infl_{t-3}
+ \gamma_0 unrate_t + \gamma_1 unrate_{t-1} + \gamma_2 unrate_{t-2} + \gamma_3 unrate_{t-3} + u_t
\]

Granger 因果检验的原假设为

\[
H_0: \gamma_1 = \gamma_2 = \gamma_3 = 0
\]

联合 F 检验结果为：

- \(F(3,192) = 5.0158\)
- \(p = 0.002272\)

由于 p 值显著小于 `0.05`，因此拒绝原假设。这说明在 `ADL(3,3)` 模型下，失业率对通胀率具有 Granger 因果关系。

从单个系数看，`unrate_lag2` 和 `unrate_lag3` 在统计上显著，而失业率当期值和一阶滞后项不显著。这意味着失业率对通胀率的影响更像是通过若干期之后的动态传导体现出来，而不是当期立即生效。

### 结论

总体来看，通胀率具有明显的持续性，在 AR 模型中 `AR(3)` 最优。在加入失业率后，BIC 选择 `ADL(3,1)`，AIC 选择更复杂的 `ADL(3,3)`，这与 AIC 更偏好复杂模型的经验结论一致。最后，Granger 因果检验表明，失业率的滞后项对通胀率具有显著的预测能力。
